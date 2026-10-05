import React, {useContext} from 'react';
import {DockSideIcon} from '@shopify/polaris-icons';

import {classNames} from '../../../../utilities/css';
import {NavigationContext} from '../../context';
import {Icon} from '../../../Icon';
import styles from '../../Navigation.module.css';

export interface LogoProps {
  logo: React.ReactNode;
  collapseLabel?: string;
  expandLabel?: string;
}

export function Logo({
  logo,
  collapseLabel = 'Collapse navigation',
  expandLabel = 'Expand navigation',
}: LogoProps) {
  const {collapsed, toggleCollapsed} = useContext(NavigationContext);

  return (
    <div
      className={classNames(
        styles.SidebarHeader,
        collapsed && styles['SidebarHeader-collapsed'],
      )}
    >
      <div className={styles.SidebarLogo}>{logo}</div>
      <button
        type="button"
        className={styles.CollapseButton}
        onClick={toggleCollapsed}
        aria-label={collapsed ? expandLabel : collapseLabel}
        aria-pressed={collapsed}
      >
        <Icon source={DockSideIcon} tone="inherit" />
      </button>
    </div>
  );
}
