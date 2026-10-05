import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {Scrollable} from '../Scrollable';
import {WithinContentContext} from '../../utilities/within-content-context';
import {FrameContext} from '../../utilities/frame';
import {classNames} from '../../utilities/css';

import {NavigationContext} from './context';
import {Section, Item, Logo} from './components';
import styles from './Navigation.module.css';

export interface NavigationFooterRenderProps {
  collapsed: boolean;
}

export interface NavigationProps {
  location: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** Content pinned below the scrollable navigation items. Use a function to adapt it to the collapsed state. */
  footer?:
    | React.ReactNode
    | ((props: NavigationFooterRenderProps) => React.ReactNode);
  onDismiss?(): void;
  /** id of the element used as aria-labelledby */
  ariaLabelledBy?: string;
}

export const Navigation: React.FunctionComponent<NavigationProps> & {
  Item: typeof Item;
  Section: typeof Section;
  Logo: typeof Logo;
} = function Navigation({
  children,
  footer,
  location,
  style,
  onDismiss,
  ariaLabelledBy,
}: NavigationProps) {
  const frame = useContext(FrameContext);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const [activeCollapsedSubNavigationId, setActiveCollapsedSubNavigationId] =
    useState<string | null>(null);
  const collapsed = frame?.navigationCollapsed ?? localCollapsed;
  const footerContent =
    typeof footer === 'function' ? footer({collapsed}) : footer;

  useEffect(() => {
    if (!collapsed) {
      setActiveCollapsedSubNavigationId(null);
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setActiveCollapsedSubNavigationId(null);
    const nextCollapsed = !collapsed;
    if (frame?.setNavigationCollapsed) {
      frame.setNavigationCollapsed(nextCollapsed);
    } else {
      setLocalCollapsed(nextCollapsed);
    }
  }, [collapsed, frame]);

  const context = useMemo(
    () => ({
      location,
      onNavigationDismiss: onDismiss,
      collapsed,
      toggleCollapsed,
      activeCollapsedSubNavigationId,
      setActiveCollapsedSubNavigationId,
    }),
    [
      location,
      onDismiss,
      collapsed,
      toggleCollapsed,
      activeCollapsedSubNavigationId,
    ],
  );

  return (
    <NavigationContext.Provider value={context}>
      <WithinContentContext.Provider value>
        <nav
          className={classNames(
            styles.Navigation,
            collapsed && styles['Navigation-collapsed'],
          )}
          aria-labelledby={ariaLabelledBy}
          style={style}
        >
          <Scrollable className={styles.PrimaryNavigation}>
            {children}
          </Scrollable>
          {footerContent && (
            <div className={styles.NavigationFooter}>{footerContent}</div>
          )}
        </nav>
      </WithinContentContext.Provider>
    </NavigationContext.Provider>
  );
};

Navigation.Item = Item;
Navigation.Section = Section;
Navigation.Logo = Logo;
