import React, { useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './SideNav.m.less';
import * as remote from '@electron/remote';
import { Badge, Menu } from 'antd';
import { EMenuItem, ESubMenuItem, ENavName } from 'services/side-nav';

export default function SideNav() {
  const {
    UserService,
    TransitionsService,
    SettingsService,
    NavigationService,
    MagicLinkService,
    UsageStatisticsService,
    SideNavService,
  } = Services;

  const isDevMode = Utils.isDevMode();

  const { studioMode, isLoggedIn, isPrime, menu } = useVuex(
    () => ({
      studioMode: TransitionsService.views.studioMode,
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
      menu: SideNavService.views.sidebar[ENavName.BottomNav],
    }),
    false,
  );

  const [dashboardOpening, setDashboardOpening] = useState(false);

  function openSettingsWindow() {
    UsageStatisticsService.actions.recordClick('NavTools', 'settings');
    SettingsService.actions.showSettings();
  }

  function openLayoutEditor() {
    UsageStatisticsService.actions.recordClick('NavTools', 'layout-editor');
    NavigationService.actions.navigate('LayoutEditor');
  }

  function openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  function toggleStudioMode() {
    UsageStatisticsService.actions.recordClick('NavTools', 'studio-mode');
    if (studioMode) {
      TransitionsService.actions.disableStudioMode();
    } else {
      TransitionsService.actions.enableStudioMode();
    }
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('NavTools', page || 'dashboard');
    if (dashboardOpening) return;
    setDashboardOpening(true);

    try {
      const link = await MagicLinkService.getDashboardMagicLink(page);
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    setDashboardOpening(false);
  }

  const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });

  function openHelp() {
    UsageStatisticsService.actions.recordClick('NavTools', 'help');
    remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('NavTools', 'prime');
    try {
      const link = await MagicLinkService.getDashboardMagicLink(
        'prime-marketing',
        'slobs-side-nav',
      );
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  return (
    <Menu forceSubMenuRender mode="inline">
      {isDevMode && (
        <Menu.Item
          key="dev-tools"
          title={EMenuItem.DevTools}
          // className={styles.cell}
          icon={<i className="icon-developer" />}
          onClick={openDevTools}
        >
          {EMenuItem.DevTools}
        </Menu.Item>
      )}
      {isLoggedIn && !isPrime && (
        <Menu.Item
          key="get-prime"
          title={$t(EMenuItem.GetPrime)}
          // className={cx(styles.cell, styles.primeCell)}
          icon={
            <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
              <>
                <i className="icon-prime" /> {$t(EMenuItem.GetPrime)}
              </>
            </Badge>
          }
          onClick={upgradeToPrime}
        >
          <>{$t(EMenuItem.GetPrime)}</>
        </Menu.Item>
      )}
      {isLoggedIn && (
        <Menu.SubMenu
          key="dashboard"
          title={$t(EMenuItem.Dashboard)}
          // className={styles.cell}
          icon={
            <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
              <i className="icon-dashboard" />
            </Badge>
          }
          // onTitleClick={() => throttledOpenDashboard()} // does this still need an onClick?
        >
          {/* TODO: if the onClicks are similar, maybe refactor to map over objects */}
          <Menu.Item
            key="cloudbot"
            title={$t(ESubMenuItem.Cloudbot)}
            // className={cx(styles.cell)}
            onClick={() => throttledOpenDashboard('cloudbot')}
          >
            {$t(ESubMenuItem.Cloudbot)}
          </Menu.Item>
          <Menu.Item
            key="alertbox-library"
            title={$t('Alert Box')}
            // className={cx(styles.cell)}
            // onClick={} // TODO: navigate to alert box library
          >
            {$t('Alert Box')}
          </Menu.Item>
          <Menu.Item
            key="widgets"
            title={$t(ESubMenuItem.Widgets)}
            // className={cx(styles.cell)}
            // onClick={} // TODO: create onClick
          >
            {$t(ESubMenuItem.Widgets)}
          </Menu.Item>
          <Menu.Item
            key="tip-settings"
            title={$t(ESubMenuItem.TipSettings)}
            // className={cx(styles.cell)}
            // onClick={} // TODO: create onClick
          >
            {$t(ESubMenuItem.TipSettings)}
          </Menu.Item>
          <Menu.Item
            key="multistream"
            title={$t(ESubMenuItem.Multistream)}
            // className={cx(styles.cell)}
            // onClick={} // TODO: create onClick
          >
            {$t(ESubMenuItem.Multistream)}
          </Menu.Item>
        </Menu.SubMenu>
      )}

      <Menu.Item
        key="get-help"
        title={$t(EMenuItem.GetHelp)}
        // className={styles.cell}
        icon={
          <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
            <i className="icon-question" />
          </Badge>
        }
        onClick={openLayoutEditor}
      >
        {$t(EMenuItem.GetHelp)}
      </Menu.Item>

      <Menu.Item
        key="settings"
        title={$t(EMenuItem.Settings)}
        // className={styles.cell}
        icon={<i className="icon-settings" />}
        onClick={openSettingsWindow}
      >
        {$t(EMenuItem.Settings)}
      </Menu.Item>

      {/* TODO: move to own component */}
      <Menu.Item
        key="login"
        title={$t(EMenuItem.Login)}
        // className={styles.cell}
        icon={
          <div>
            <i className="icon-user" /> <i className="icon-logout" />
          </div>
        }
        // onClick={openSettingsWindow}
      >
        {$t(EMenuItem.Login)}
      </Menu.Item>
    </Menu>
  );
}
