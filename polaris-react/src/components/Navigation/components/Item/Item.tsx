import React, {useContext, useEffect, useState, useRef, useId} from 'react';
import type {MouseEvent, ReactNode} from 'react';

import {useIsomorphicLayoutEffect} from '../../../../utilities/use-isomorphic-layout-effect';
import {classNames} from '../../../../utilities/css';
import {NavigationContext} from '../../context';
import {Badge} from '../../../Badge';
import {ActionList} from '../../../ActionList';
import {Icon} from '../../../Icon';
import {Indicator} from '../../../Indicator';
import {Portal} from '../../../Portal';
import {Text} from '../../../Text';
import type {TextProps} from '../../../Text';
import {UnstyledButton} from '../../../UnstyledButton';
import {UnstyledLink} from '../../../UnstyledLink';
import {useI18n} from '../../../../utilities/i18n';
import styles from '../../Navigation.module.css';
import {Tooltip} from '../../../Tooltip';
import {MatchState} from '../../types';
import type {ItemProps, SecondaryAction, ItemURLDetails} from '../../types';

import {SecondaryNavigation} from './components';

export const MAX_SECONDARY_ACTIONS = 2;
const TOOLTIP_HOVER_DELAY = 1000;
const SUB_NAVIGATION_CLOSE_DELAY = 150;
const SUB_NAVIGATION_GAP = 8;

export function Item({
  url,
  icon: baseIcon,
  matchedItemIcon,
  label,
  subNavigationItems = [],
  secondaryAction,
  secondaryActions,
  displayActionsOnHover,
  disabled,
  onClick,
  accessibilityLabel,
  selected: selectedOverride,
  badge,
  new: isNew,
  matches,
  exactMatch,
  matchPaths,
  excludePaths,
  external,
  onToggleExpandedState,
  expanded,
  shouldResizeIcon,
  truncateText,
  showVerticalLine,
  showVerticalHoverPointer,
  level = 0,
  onMouseEnter,
  onMouseLeave,
}: ItemProps) {
  const i18n = useI18n();
  // const {isNavigationCollapsed} = useMediaQuery();
  const secondaryNavigationId = useId();
  const {
    location,
    onNavigationDismiss,
    collapsed,
    toggleCollapsed,
    activeCollapsedSubNavigationId,
    setActiveCollapsedSubNavigationId,
  } = useContext(NavigationContext);
  const navTextRef = useRef<HTMLSpanElement>(null);
  const listItemRef = useRef<HTMLLIElement>(null);
  const collapsedSubNavigationRef = useRef<HTMLDivElement>(null);
  const closeSubNavigationTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showCollapsedSubNavigation, setShowCollapsedSubNavigation] =
    useState(false);
  const [subNavigationPosition, setSubNavigationPosition] = useState({
    top: 0,
    left: 0,
  });

  const hasCollapsedSubNavigation =
    collapsed && level === 0 && subNavigationItems.length > 0 && !disabled;
  const collapsedSubNavigationIsActive =
    activeCollapsedSubNavigationId === undefined
      ? showCollapsedSubNavigation
      : activeCollapsedSubNavigationId === secondaryNavigationId &&
        showCollapsedSubNavigation;

  useEffect(() => {
    if (!collapsed) {
      setShowCollapsedSubNavigation(false);
    }
  }, [collapsed]);

  useEffect(() => () => clearTimeout(closeSubNavigationTimeout.current), []);

  useIsomorphicLayoutEffect(() => {
    if (!hasCollapsedSubNavigation || !collapsedSubNavigationIsActive) return;

    const updatePosition = () => {
      const anchor = listItemRef.current;
      const panel = collapsedSubNavigationRef.current;
      if (!anchor || !panel) return;

      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      setSubNavigationPosition({
        top: Math.max(
          SUB_NAVIGATION_GAP,
          Math.min(
            anchorRect.top,
            window.innerHeight - panelRect.height - SUB_NAVIGATION_GAP,
          ),
        ),
        left: Math.max(
          SUB_NAVIGATION_GAP,
          Math.min(
            anchorRect.right + SUB_NAVIGATION_GAP,
            window.innerWidth - panelRect.width - SUB_NAVIGATION_GAP,
          ),
        ),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [hasCollapsedSubNavigation, collapsedSubNavigationIsActive]);

  // @loophone modified - always expand when there are sub navigation items
  // useEffect(() => {
  //   if (!isNavigationCollapsed && expanded) {
  //     onToggleExpandedState?.();
  //   }
  // }, [expanded, isNavigationCollapsed, onToggleExpandedState]);

  useIsomorphicLayoutEffect(() => {
    const navTextNode = navTextRef.current;
    if (truncateText && navTextNode) {
      setIsTruncated(navTextNode.scrollHeight > navTextNode.clientHeight);
    }
  }, [truncateText]);

  const tabIndex = disabled ? -1 : 0;

  const hasNewChild =
    subNavigationItems.filter((subNavigationItem) => subNavigationItem.new)
      .length > 0;

  const indicatorMarkup = hasNewChild ? (
    <span className={styles.Indicator}>
      <Indicator pulse />
    </span>
  ) : null;

  const matchState = matchStateForItem(
    {url, matches, exactMatch, matchPaths, excludePaths},
    location,
  );

  const matchingSubNavigationItems = subNavigationItems.filter((item) => {
    const subMatchState = matchStateForItem(item, location);
    return (
      subMatchState === MatchState.MatchForced ||
      subMatchState === MatchState.MatchUrl ||
      subMatchState === MatchState.MatchPaths
    );
  });

  const childIsActive = matchingSubNavigationItems.length > 0;

  const selected =
    selectedOverride == null
      ? matchState === MatchState.MatchForced ||
        matchState === MatchState.MatchUrl ||
        matchState === MatchState.MatchPaths
      : selectedOverride;

  const icon =
    selected || childIsActive ? matchedItemIcon ?? baseIcon : baseIcon;

  let iconMarkup: ReactNode = null;
  if (icon) {
    iconMarkup = (
      <div
        className={classNames(
          styles.Icon,
          shouldResizeIcon && styles['Icon-resized'],
        )}
      >
        <Icon source={icon} />
      </div>
    );
  } else if (collapsed && level === 0) {
    iconMarkup = (
      <span
        className={classNames(styles.Icon, styles.FallbackIcon)}
        aria-hidden
      >
        {label.slice(0, 1)}
      </span>
    );
  }

  let badgeMarkup: ReactNode = null;
  if (isNew) {
    badgeMarkup = (
      <Badge tone="new">
        {i18n.translate('Polaris.Badge.TONE_LABELS.new')}
      </Badge>
    );
  } else if (typeof badge === 'string') {
    badgeMarkup = <Badge tone="new">{badge}</Badge>;
  } else {
    badgeMarkup = badge;
  }

  const wrappedBadgeMarkup =
    badgeMarkup == null ? null : (
      <div className={styles.Badge}>{badgeMarkup}</div>
    );

  const tone =
    !showVerticalHoverPointer && !matches && level !== 0
      ? 'subdued'
      : undefined;
  let fontWeight: TextProps['fontWeight'] = 'regular';
  if ((matches || selected) && !childIsActive) {
    fontWeight = 'semibold';
  } else if (level === 0 || showVerticalHoverPointer) {
    fontWeight = 'medium';
  }

  const itemLabelMarkup = (
    <span
      className={classNames(
        styles.Text,
        truncateText && styles['Text-truncated'],
      )}
      ref={navTextRef}
    >
      <Text as="span" variant="bodyMd" tone={tone} fontWeight={fontWeight}>
        {label}
      </Text>
      {indicatorMarkup}
    </span>
  );

  // @loophone modified - always render as button, even without url
  // if (url == null) {
  //   const className = classNames(
  //     styles.Item,
  //     disabled && styles['Item-disabled'],
  //     selectedOverride && styles['Item-selected'],
  //   );

  //   return (
  //     <li className={styles.ListItem}>
  //       <div className={styles.ItemWrapper}>
  //         <div
  //           className={classNames(
  //             styles.ItemInnerWrapper,
  //             disabled && styles.ItemInnerDisabled,
  //             selectedOverride && styles['ItemInnerWrapper-selected'],
  //           )}
  //         >
  //           <button
  //             type="button"
  //             className={className}
  //             disabled={disabled}
  //             aria-disabled={disabled}
  //             aria-label={accessibilityLabel}
  //             onClick={getClickHandler(onClick)}
  //           >
  //             {iconMarkup}
  //             {itemLabelMarkup}
  //             {wrappedBadgeMarkup}
  //           </button>
  //         </div>
  //       </div>
  //     </li>
  //   );
  // }

  if (secondaryAction && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      'Deprecation: The `secondaryAction` prop on the `Navigation.Item` has been deprecated. Use `secondaryActions` instead.',
    );
  }

  const actions = secondaryActions || (secondaryAction && [secondaryAction]);

  if (actions && actions.length > MAX_SECONDARY_ACTIONS) {
    actions.length = MAX_SECONDARY_ACTIONS;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        `secondaryActions must have a maximum of ${MAX_SECONDARY_ACTIONS} actions. Only the first ${MAX_SECONDARY_ACTIONS} actions will be rendered.`,
      );
    }
  }

  const secondaryActionMarkup = actions?.length ? (
    <span className={styles.SecondaryActions}>
      {actions.map((action) => (
        <ItemSecondaryAction
          key={action.accessibilityLabel}
          {...action}
          tabIndex={tabIndex}
          disabled={disabled}
        />
      ))}
    </span>
  ) : null;

  const itemContentMarkup = (
    <>
      {iconMarkup}
      {itemLabelMarkup}
      {secondaryActionMarkup ? null : wrappedBadgeMarkup}
    </>
  );

  const outerContentMarkup = (
    <>{secondaryActionMarkup ? wrappedBadgeMarkup : null}</>
  );

  const showExpanded = selected || expanded || childIsActive;
  const showOpenParent = selected && childIsActive && !collapsed;
  const showSelectedParent = selected || (collapsed && childIsActive);
  const longestMatch = matchingSubNavigationItems.sort(
    ({url: firstUrl}, {url: secondUrl}) => secondUrl.length - firstUrl.length,
  )[0];

  const itemClassName = classNames(
    styles.Item,
    disabled && styles['Item-disabled'],
    (selected || childIsActive) && styles['Item-selected'],
    showExpanded && styles.subNavigationActive,
    childIsActive && styles['Item-child-active'],
    showVerticalLine && styles['Item-line'],
    matches && styles['Item-line-pointer'],
    showVerticalHoverPointer && styles['Item-hover-pointer'],
  );

  let secondaryNavigationMarkup: ReactNode = null;

  if (subNavigationItems.length > 0) {
    secondaryNavigationMarkup = (
      <SecondaryNavigation
        ItemComponent={Item}
        icon={icon}
        longestMatch={longestMatch}
        subNavigationItems={subNavigationItems}
        showExpanded={showExpanded}
        truncateText={truncateText}
        secondaryNavigationId={secondaryNavigationId}
      />
    );
  }

  const collapsedSubNavigationMarkup =
    hasCollapsedSubNavigation && collapsedSubNavigationIsActive ? (
      <Portal idPrefix="navigation-submenu">
        <div
          ref={collapsedSubNavigationRef}
          className={styles.CollapsedSubNavigation}
          style={subNavigationPosition}
          role="group"
          aria-label={label}
          onMouseEnter={() => clearTimeout(closeSubNavigationTimeout.current)}
          onMouseLeave={scheduleCloseSubNavigation}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              closeCollapsedSubNavigation();
              listItemRef.current?.querySelector('a')?.focus();
            }
          }}
        >
          <ActionList
            actionRole="menuitem"
            items={subNavigationItems.map((item) => ({
              content: item.label,
              url: item.url,
              external: item.external,
              disabled: item.disabled,
              active: item === longestMatch,
              onAction: () => {
                if (!expanded) {
                  onToggleExpandedState?.();
                }
                onNavigationDismiss?.();
                if (item.onClick !== onNavigationDismiss) {
                  item.onClick?.();
                }
              },
            }))}
            onActionAnyItem={closeCollapsedSubNavigation}
          />
        </div>
      </Portal>
    ) : null;

  const className = classNames(
    styles.ListItem,
    Boolean(actions && actions.length) && styles['ListItem-hasAction'],
  );

  const itemLinkMarkup = () => {
    const linkMarkup = (
      <UnstyledLink
        url={url}
        className={itemClassName}
        external={external}
        tabIndex={tabIndex}
        aria-disabled={disabled}
        aria-label={accessibilityLabel ?? (collapsed ? label : undefined)}
        onClick={getClickHandler(onClick)}
        {...normalizeAriaAttributes(
          secondaryNavigationId,
          subNavigationItems.length > 0,
          showExpanded && !collapsed,
        )}
      >
        {itemContentMarkup}
      </UnstyledLink>
    );

    return isTruncated ||
      (collapsed && level === 0 && !hasCollapsedSubNavigation) ? (
      <Tooltip
        hoverDelay={TOOLTIP_HOVER_DELAY}
        content={label}
        preferredPosition="above"
      >
        {linkMarkup}
      </Tooltip>
    ) : (
      linkMarkup
    );
  };

  return (
    <li
      ref={listItemRef}
      className={className}
      onMouseEnter={() => {
        onMouseEnter?.(label);
        if (hasCollapsedSubNavigation) {
          openCollapsedSubNavigation();
        } else if (collapsed && level === 0) {
          setActiveCollapsedSubNavigationId?.(null);
        }
      }}
      onMouseLeave={() => {
        onMouseLeave?.();
        if (hasCollapsedSubNavigation) {
          scheduleCloseSubNavigation();
        }
      }}
    >
      <div className={styles.ItemWrapper}>
        <div
          className={classNames(
            styles.ItemInnerWrapper,
            showOpenParent && styles['ItemInnerWrapper-open'],
            showSelectedParent &&
              !showOpenParent &&
              styles['ItemInnerWrapper-selected'],
            displayActionsOnHover &&
              styles['ItemInnerWrapper-display-actions-on-hover'],
            disabled && styles.ItemInnerDisabled,
          )}
        >
          {displayActionsOnHover &&
          secondaryActionMarkup &&
          wrappedBadgeMarkup ? (
            <span className={styles.ItemWithFloatingActions}>
              {itemLinkMarkup()}
              {secondaryActionMarkup}
            </span>
          ) : (
            <>
              {itemLinkMarkup()}
              {secondaryActionMarkup}
            </>
          )}
          {outerContentMarkup}
        </div>
      </div>
      {secondaryNavigationMarkup}
      {collapsedSubNavigationMarkup}
    </li>
  );

  function openCollapsedSubNavigation() {
    clearTimeout(closeSubNavigationTimeout.current);
    const anchorRect = listItemRef.current?.getBoundingClientRect();
    if (!anchorRect) return;
    setSubNavigationPosition({
      top: anchorRect.top,
      left: anchorRect.right + SUB_NAVIGATION_GAP,
    });
    setShowCollapsedSubNavigation(true);
    setActiveCollapsedSubNavigationId?.(secondaryNavigationId);
  }

  function closeCollapsedSubNavigation() {
    clearTimeout(closeSubNavigationTimeout.current);
    setShowCollapsedSubNavigation(false);
    setActiveCollapsedSubNavigationId?.((current) =>
      current === secondaryNavigationId ? null : current,
    );
  }

  function scheduleCloseSubNavigation() {
    clearTimeout(closeSubNavigationTimeout.current);
    closeSubNavigationTimeout.current = setTimeout(
      closeCollapsedSubNavigation,
      SUB_NAVIGATION_CLOSE_DELAY,
    );
  }

  function getClickHandler(onClick: ItemProps['onClick']) {
    return (event: MouseEvent<HTMLElement>) => {
      const {currentTarget} = event;

      if (currentTarget.getAttribute('href') === location) {
        event.preventDefault();
      }

      // @loophone modified - always expand when there are sub navigation items, regardless of collapse state
      // if (
      //   subNavigationItems &&
      //   subNavigationItems.length > 0 &&
      //   isNavigationCollapsed
      // ) {
      if (subNavigationItems && subNavigationItems.length > 0) {
        event.preventDefault();
        if (collapsed) {
          toggleCollapsed?.();
          if (!expanded) {
            onToggleExpandedState?.();
          }
          return;
        }
        onToggleExpandedState?.();
      } else if (onNavigationDismiss) {
        onNavigationDismiss();
        if (onClick && onClick !== onNavigationDismiss) {
          onClick();
        }
        return;
      }

      if (onClick) {
        onClick();
      }
    };
  }
}

interface ItemSecondaryActionProps extends SecondaryAction {
  tabIndex: number;
  disabled?: boolean;
}

export function ItemSecondaryAction({
  url,
  icon,
  accessibilityLabel,
  tooltip,
  onClick,
  disabled,
  tabIndex,
}: ItemSecondaryActionProps) {
  const markup = url ? (
    <UnstyledLink
      external
      url={url}
      className={styles.SecondaryAction}
      tabIndex={tabIndex}
      aria-disabled={disabled}
      aria-label={accessibilityLabel}
      onClick={onClick}
    >
      <Icon source={icon} />
    </UnstyledLink>
  ) : (
    <UnstyledButton
      className={styles.SecondaryAction}
      tabIndex={tabIndex}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onClick={onClick}
    >
      <Icon source={icon} />
    </UnstyledButton>
  );

  return tooltip ? <Tooltip {...tooltip}> {markup} </Tooltip> : markup;
}

export function isNavigationItemActive(
  navigationItem: ItemProps,
  currentPath: string,
) {
  const matchState = matchStateForItem(navigationItem, currentPath);

  const matchingSubNavigationItems =
    navigationItem.subNavigationItems &&
    navigationItem.subNavigationItems.filter((item) => {
      const subMatchState = matchStateForItem(item, currentPath);
      return (
        subMatchState === MatchState.MatchForced ||
        subMatchState === MatchState.MatchUrl ||
        subMatchState === MatchState.MatchPaths
      );
    });

  const childIsActive =
    matchingSubNavigationItems && matchingSubNavigationItems.length > 0;

  const selected =
    matchState === MatchState.MatchForced ||
    matchState === MatchState.MatchUrl ||
    matchState === MatchState.MatchPaths;

  return selected || childIsActive;
}

function normalizePathname(pathname: string) {
  const barePathname = pathname.split('?')[0].split('#')[0];
  return barePathname.endsWith('/') ? barePathname : `${barePathname}/`;
}

function safeEqual(location: string, path: string) {
  return normalizePathname(location) === normalizePathname(path);
}

function safeStartsWith(location: string, path: string) {
  return normalizePathname(location).startsWith(normalizePathname(path));
}

function matchStateForItem(
  {url, matches, exactMatch, matchPaths, excludePaths}: ItemURLDetails,
  location: string,
) {
  if (url == null) {
    return MatchState.NoMatch;
  }

  if (matches) {
    return MatchState.MatchForced;
  }

  if (
    matches === false ||
    (excludePaths &&
      excludePaths.some((path) => safeStartsWith(location, path)))
  ) {
    return MatchState.Excluded;
  }

  if (matchPaths && matchPaths.some((path) => safeStartsWith(location, path))) {
    return MatchState.MatchPaths;
  }

  const matchesUrl = exactMatch
    ? safeEqual(location, url)
    : safeStartsWith(location, url);
  return matchesUrl ? MatchState.MatchUrl : MatchState.NoMatch;
}

function normalizeAriaAttributes(
  controlId: string,
  hasSubMenu: boolean,
  expanded: boolean,
) {
  return hasSubMenu
    ? {
        'aria-expanded': expanded,
        'aria-controls': controlId,
      }
    : undefined;
}
