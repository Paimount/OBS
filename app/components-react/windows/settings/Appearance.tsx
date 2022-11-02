import React from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { Row, Col, Select } from 'antd';
import { CheckboxInput, ListInput, SliderInput, SwitchInput } from '../../shared/inputs';
import { getDefined } from '../../../util/properties-type-guards';
import { ObsSettingsSection } from './ObsSettings';
import * as remote from '@electron/remote';
import { injectFormBinding, useModule } from 'slap';
import { ENavName, EMenuItem, IAppMenuItem } from 'services/side-nav';
import { useVuex } from 'components-react/hooks';
import styles from './Appearance.m.less';
import cx from 'classnames';
import { EAppPageSlot } from 'services/platform-apps';
import Scrollable from 'components-react/shared/Scrollable';

const { Option } = Select;

export function AppearanceSettings() {
  const {
    CustomizationService,
    WindowsService,
    UserService,
    MagicLinkService,
    SideNavService,
    PlatformAppsService,
  } = Services;

  const { bind } = useModule(() => {
    function getSettings() {
      return CustomizationService.state;
    }

    function setSettings(newSettings: typeof CustomizationService.state) {
      CustomizationService.actions.setSettings(newSettings);
    }

    return { bind: injectFormBinding(getSettings, setSettings) };
  });

  const {
    compactView,
    menuItems,
    apps,
    displayedApps,
    showCustomEditor,
    isLoggedIn,
    isPrime,
    toggleApp,
    swapApp,
    toggleSidebarSubMenu,
    toggleMenuItem,
    setCompactView,
  } = useVuex(() => ({
    compactView: SideNavService.views.compactView,
    menuItems: SideNavService.views.menuItems,
    apps: PlatformAppsService.views.enabledApps.filter(app => {
      return !!app.manifest.pages.find(page => {
        return page.slot === EAppPageSlot.TopNav;
      });
    }),
    displayedApps: Object.values(SideNavService.views.apps).sort((a, b) => a.index - b.index),
    showCustomEditor: SideNavService.views.showCustomEditor,
    isLoggedIn: UserService.views.isLoggedIn,
    isPrime: UserService.views.isPrime,
    toggleApp: SideNavService.actions.toggleApp,
    swapApp: SideNavService.actions.swapApp,
    toggleSidebarSubMenu: SideNavService.actions.toggleSidebarSubmenu,
    toggleMenuItem: SideNavService.actions.toggleMenuItem,
    setCompactView: SideNavService.actions.setCompactView,
  }));

  function openFFZSettings() {
    WindowsService.createOneOffWindow(
      {
        componentName: 'FFZSettings',
        title: $t('FrankerFaceZ Settings'),
        queryParams: {},
        size: {
          width: 800,
          height: 800,
        },
      },
      'ffz-settings',
    );
  }

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    remote.shell.openExternal(link);
  }

  const shouldShowPrime = isLoggedIn && !isPrime;
  const shouldShowEmoteSettings = isLoggedIn && getDefined(UserService.platform).type === 'twitch';

  /**
   * Sort apps
   */

  const displayedAppsList = Object.values(displayedApps);

  const enabledApps = apps.reduce(
    (enabled: { id: string; name?: string; icon?: string; isActive: boolean }[], app) => {
      if (app) {
        enabled.push({
          id: app.id,
          name: app.manifest?.name,
          icon: app.manifest?.icon,
          isActive: displayedAppsList[app.id]?.isActive ?? false,
        });
      }
      return enabled;
    },
    [],
  );

  // const enabledApps = apps.map(
  //   app =>
  //     app && {
  //       id: app.id,
  //       name: app.manifest?.name,
  //       icon: app.manifest?.icon,
  //       isActive: displayedAppsList[app.id]?.isActive ?? false,
  //     },
  // );

  const appSelectFields = [...Array(5)].map((field, index) => {
    if (displayedAppsList[index]) {
      return displayedAppsList[index];
    } else if (enabledApps && enabledApps[index]) {
      swapApp({ ...enabledApps[index], isActive: false, index });
      return { ...enabledApps[index], isActive: false, index };
    }
  });

  return (
    <div className={styles.container}>
      <ObsSettingsSection>
        <ListInput {...bind.theme} label={'Theme'} options={CustomizationService.themeOptions} />
        {shouldShowPrime && (
          <div className={styles.primeContainer}>
            <a className={styles.primeContainer} onClick={upgradeToPrime}>
              <i className={cx('icon-prime', styles.primeContainer)} />
              {$t('Change the look of Streamlabs Desktop with Prime')}
            </a>
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Chat Settings')}>
        <CheckboxInput
          {...bind.leftDock}
          label={$t('Show the live dock (chat) on the left side')}
        />
        <SliderInput
          {...bind.chatZoomFactor}
          label={$t('Text Size')}
          tipFormatter={(val: number) => `${val * 100}%`}
          min={0.25}
          max={2}
          step={0.25}
        />

        {shouldShowEmoteSettings && (
          <div>
            <CheckboxInput
              {...bind.enableBTTVEmotes}
              label={$t('Enable BetterTTV emotes for Twitch')}
            />
            <CheckboxInput
              {...bind.enableFFZEmotes}
              label={$t('Enable FrankerFaceZ emotes for Twitch')}
            />
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Custom Navigation Bar')}>
        <CheckboxInput
          onChange={value => setCompactView(!value)}
          label={$t(
            'Enable custom navigation bar to pin your favorite features for quick access.\nDisable to swap to compact view.',
          )}
          value={!compactView}
          className={cx(styles.settingsCheckbox)}
          disabled={!isLoggedIn}
        />
        {/* SIDENAV SETTINGS */}
        <Row className={styles.sidenavSettings}>
          <Col flex={1} className={styles.menuControls}>
            <SwitchInput
              label={$t(EMenuItem.Editor)}
              layout="horizontal"
              onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.Editor)}
              value={menuItems[EMenuItem.Editor].isActive}
              disabled={!isLoggedIn}
            />
            <SwitchInput
              label={$t('Custom Editor')}
              layout="horizontal"
              onChange={() => toggleSidebarSubMenu()}
              value={isLoggedIn && showCustomEditor}
              disabled={!isLoggedIn}
            />
            <SwitchInput
              label={$t(EMenuItem.StudioMode)}
              layout="horizontal"
              onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.StudioMode)}
              value={menuItems[EMenuItem.StudioMode].isActive}
              disabled={!isLoggedIn}
            />
            <SwitchInput
              label={$t(EMenuItem.LayoutEditor)}
              layout="horizontal"
              onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.LayoutEditor)}
              value={menuItems[EMenuItem.LayoutEditor].isActive}
              disabled={!isLoggedIn}
            />
            <SwitchInput
              label={$t(EMenuItem.Themes)}
              layout="horizontal"
              onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.Themes)}
              value={menuItems[EMenuItem.Themes].isActive}
              disabled={!isLoggedIn}
            />
            <SwitchInput
              label={$t(EMenuItem.Highlighter)}
              layout="horizontal"
              onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.Highlighter)}
              value={menuItems[EMenuItem.Highlighter].isActive}
              disabled={!isLoggedIn}
            />
          </Col>

          {/* SIDENAV APPS SETTINGS */}
          <Col flex={5}>
            <Scrollable style={{ height: '100%', right: '5px' }} snapToWindowEdge>
              <SwitchInput
                label={$t(EMenuItem.AppStore)}
                layout="horizontal"
                onChange={() => toggleMenuItem(ENavName.TopNav, EMenuItem.AppStore)}
                value={menuItems[EMenuItem.AppStore].isActive}
                disabled={!isLoggedIn}
              />

              {appSelectFields.map((app: IAppMenuItem | undefined, index: number) => (
                <Row key={`app-${index + 1}`} className={styles.appsSelector}>
                  <SwitchInput
                    label={`${$t('App')} ${index + 1}`}
                    layout="horizontal"
                    onChange={() => app?.id && toggleApp(app.id)}
                    value={app && app?.isActive}
                    disabled={!isLoggedIn || index + 1 > apps.length}
                  />

                  {/* dropdown options for apps */}
                  <Select
                    defaultValue={app?.name ?? enabledApps[0]?.name ?? ''}
                    className={styles.appsDropdown}
                    onChange={value => {
                      const data = enabledApps.find(data => data?.name === value);
                      swapApp({ ...data, isActive: app ? app.isActive : false, index });
                    }}
                    value={app?.name}
                    disabled={!isLoggedIn || index + 1 > apps.length}
                  >
                    {enabledApps.map(enabledApp => (
                      <Option key={enabledApp?.id} value={enabledApp?.name || ''}>
                        {enabledApp?.name}
                      </Option>
                    ))}
                  </Select>
                </Row>
              ))}
            </Scrollable>
          </Col>
        </Row>
      </ObsSettingsSection>

      <ObsSettingsSection>
        <CheckboxInput
          {...bind.enableAnnouncements}
          label={$t('Show announcements for new Streamlabs features and products')}
          className={styles.extraMargin}
        />
      </ObsSettingsSection>

      <ObsSettingsSection className={styles.extraMargin}>
        <ListInput
          {...bind.folderSelection}
          label={$t('Scene item selection mode')}
          options={[
            { value: true, label: $t('Single click selects group. Double click selects item') },
            {
              value: false,
              label: $t('Double click selects group. Single click selects item'),
            },
          ]}
        />
      </ObsSettingsSection>

      {bind.enableFFZEmotes.value && (
        <div className="section">
          <button className="button button--action" onClick={openFFZSettings}>
            {$t('Open FrankerFaceZ Settings')}
          </button>
        </div>
      )}
    </div>
  );
}

AppearanceSettings.page = 'Appearance';
