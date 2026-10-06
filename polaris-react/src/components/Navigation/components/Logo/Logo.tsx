import React, {useContext, useEffect, useRef, useState} from 'react';
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
  const [isCollapsing, setIsCollapsing] = useState(false);
  const collapseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (collapseTimeout.current !== null) {
        clearTimeout(collapseTimeout.current);
      }
    },
    [],
  );

  const handleToggle = () => {
    if (collapseTimeout.current !== null) {
      clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }

    if (collapsed) {
      setIsCollapsing(false);
    } else {
      setIsCollapsing(true);
      const navigation = headerRef.current?.closest('nav');
      const transitionDuration = navigation
        ? window.getComputedStyle(navigation).transitionDuration.split(',')[0]
        : '0s';
      const duration =
        Number.parseFloat(transitionDuration) *
        (transitionDuration.trim().endsWith('ms') ? 1 : 1000);
      collapseTimeout.current = setTimeout(() => {
        setIsCollapsing(false);
        collapseTimeout.current = null;
      }, duration);
    }

    toggleCollapsed?.();
  };

  return (
    <div
      ref={headerRef}
      className={classNames(
        styles.SidebarHeader,
        collapsed && styles['SidebarHeader-collapsed'],
        isCollapsing && styles['SidebarHeader-collapsing'],
      )}
    >
      <div className={styles.SidebarLogo}>{logo}</div>
      <button
        type="button"
        className={styles.CollapseButton}
        onClick={handleToggle}
        aria-label={collapsed ? expandLabel : collapseLabel}
        aria-pressed={collapsed}
      >
        <Icon source={DockSideIcon} tone="inherit" />
      </button>
    </div>
  );
}
