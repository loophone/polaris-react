import React, {useMemo} from 'react';

import {Scrollable} from '../Scrollable';
import {WithinContentContext} from '../../utilities/within-content-context';

import {NavigationContext} from './context';
import {Section, Item} from './components';
import styles from './Navigation.module.css';

export interface NavigationProps {
  location: string;
  children?: React.ReactNode;
  contextControl?: React.ReactNode;
  onDismiss?(): void;
  /** id of the element used as aria-labelledby */
  ariaLabelledBy?: string;
  /** Accepts a component that is used to supplement the logo markup */
  logoSuffix?: React.ReactNode;
}

export const Navigation: React.FunctionComponent<NavigationProps> & {
  Item: typeof Item;
  Section: typeof Section;
} = function Navigation({
  children,
  location,
  onDismiss,
  ariaLabelledBy,
}: NavigationProps) {
  const context = useMemo(
    () => ({location, onNavigationDismiss: onDismiss}),
    [location, onDismiss],
  );

  return (
    <NavigationContext.Provider value={context}>
      <WithinContentContext.Provider value>
        <nav className={styles.Navigation} aria-labelledby={ariaLabelledBy}>
          <Scrollable className={styles.PrimaryNavigation}>
            {children}
          </Scrollable>
        </nav>
      </WithinContentContext.Provider>
    </NavigationContext.Provider>
  );
};

Navigation.Item = Item;
Navigation.Section = Section;
