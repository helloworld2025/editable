import * as React from 'react'

import { RouteItem } from 'components/layout/use-route-meta'
import { useRouter } from 'next/router'
import { removeFromLast } from 'utils/remove-from-last'
import { useRouteMeta } from '../use-route-meta'
import { SidebarLink } from './sidebar-link'
import useCollapse from 'react-collapsed'
import usePendingRoute from 'hooks/usePendingRoute'
import tw from 'twin.macro'

interface SidebarRouteTreeProps {
  isForceExpanded: boolean
  routeTree: RouteItem
  level?: number
}

function CollapseWrapper({
  isExpanded,
  duration,
  children,
}: {
  isExpanded: boolean
  duration: number
  children: any
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const timeoutRef = React.useRef<number | null>(null)
  const { getCollapseProps } = useCollapse({
    isExpanded,
    duration,
  })

  // Disable pointer events while animating.
  const isExpandedRef = React.useRef(isExpanded)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      const wasExpanded = isExpandedRef.current
      if (wasExpanded === isExpanded) {
        return
      }
      isExpandedRef.current = isExpanded
      if (ref.current !== null) {
        const node: HTMLDivElement = ref.current
        node.style.pointerEvents = 'none'
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = window.setTimeout(() => {
          node.style.pointerEvents = ''
        }, duration + 100)
      }
    })
  }

  return (
    <div
      ref={ref}
      css={[isExpanded && tw`opacity-100`, !isExpanded && tw`opacity-50`]}
      style={{
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    >
      <div {...getCollapseProps()}>{children}</div>
    </div>
  )
}

export function SidebarRouteTree({ isForceExpanded, routeTree, level = 0 }: SidebarRouteTreeProps) {
  const { breadcrumbs } = useRouteMeta(routeTree)
  const cleanedPath = useRouter().asPath.split(/[\?\#]/)[0]
  const pendingRoute = usePendingRoute()

  const slug = cleanedPath
  const currentRoutes = routeTree.routes as RouteItem[]
  const expandedPath = currentRoutes.reduce((acc: string | undefined, curr: RouteItem) => {
    if (acc) return acc
    const breadcrumb = breadcrumbs.find(b => b.path === curr.path)
    if (breadcrumb) {
      return curr.path
    }
    if (curr.path === cleanedPath) {
      return cleanedPath
    }
    return undefined
  }, undefined)

  const expanded = expandedPath
  return (
    <ul>
      {currentRoutes.map(({ path, title, routes, wip, heading, hasSeparator, target }) => {
        const pagePath = path && removeFromLast(path, '.')
        const selected = slug === pagePath

        let listItem = null
        if (!path || !pagePath || heading) {
          // if current route item has no path and children treat it as an API sidebar heading
          listItem = (
            <SidebarRouteTree
              level={level + 1}
              isForceExpanded={isForceExpanded}
              routeTree={{ title, routes }}
            />
          )
        } else if (routes) {
          // if route has a path and child routes, treat it as an expandable sidebar item
          const isExpanded = isForceExpanded || expanded === path
          listItem = (
            <li key={`${title}-${path}-${level}-heading`}>
              <SidebarLink
                key={`${title}-${path}-${level}-link`}
                href={pagePath}
                isPending={pendingRoute === pagePath}
                selected={selected}
                level={level}
                title={title}
                wip={wip}
                isExpanded={isExpanded}
                isBreadcrumb={expandedPath === path}
                hideArrow={isForceExpanded}
                target={target}
              />
              <CollapseWrapper duration={250} isExpanded={isExpanded}>
                <SidebarRouteTree
                  isForceExpanded={isForceExpanded}
                  routeTree={{ title, routes }}
                  level={level + 1}
                />
              </CollapseWrapper>
            </li>
          )
        } else {
          // if route has a path and no child routes, treat it as a sidebar link
          listItem = (
            <li key={`${title}-${path}-${level}-link`}>
              <SidebarLink
                isPending={pendingRoute === pagePath}
                href={path.startsWith('https://') ? path : pagePath}
                selected={selected}
                level={level}
                title={title}
                wip={wip}
                target={target}
              />
            </li>
          )
        }

        if (hasSeparator) {
          return (
            <React.Fragment key={`${title}-${path}-${level}-separator`}>
              <li role="separator" tw="border-border dark:border-border-dark my-2 ml-5 border-b" />
              {listItem}
            </React.Fragment>
          )
        } else {
          return listItem
        }
      })}
    </ul>
  )
}
