import React from 'react';
import {mountWithApp} from 'tests/utilities';

import {Navigation} from '../Navigation';
import {NavigationContext} from '../context';
import {Frame} from '../../Frame';
import {Image} from '../../Image';
import {WithinContentContext} from '../../../utilities/within-content-context';

describe('<Navigation />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('renders an image if the theme provider is present', () => {
    const navigation = mountWithApp(<Navigation location="/" />, {
      frame: {logo: {url: 'https://shopify.com/logo'}},
    });
    expect(navigation).toContainReactComponent(Image);
  });

  it('renders nav with aria-labelledby when passed as prop', () => {
    const label = 'label-id';
    const navigation = mountWithApp(
      <Navigation location="/" ariaLabelledBy={label} />,
    );
    expect(navigation).toContainReactComponent('nav', {
      'aria-labelledby': label,
    });
  });

  it('renders the footer outside the scrollable navigation items', () => {
    const navigation = mountWithApp(
      <Navigation
        location="/"
        footer={
          <Navigation.Section items={[{label: 'Settings', url: '/settings'}]} />
        }
      >
        <Navigation.Section items={[{label: 'Orders', url: '/orders'}]} />
      </Navigation>,
    );

    const nav = navigation.find('nav')?.domNode;
    const scrolling = nav?.querySelector('.PrimaryNavigation');
    const footer = nav?.querySelector('.NavigationFooter');

    expect(footer).not.toBeNull();
    expect(scrolling?.contains(footer as Node)).toBe(false);
    expect(footer?.textContent).toContain('Settings');
  });

  it('updates a rendered footer when the navigation collapses', () => {
    const navigation = mountWithApp(
      <Frame
        navigation={
          <Navigation
            location="/"
            footer={({collapsed}) => (
              <span>{collapsed ? 'Account avatar' : 'Account details'}</span>
            )}
          >
            <Navigation.Logo logo={<span>Shop</span>} />
          </Navigation>
        }
      />,
    );

    const footerText = () =>
      navigation.find('nav')?.domNode?.querySelector('.NavigationFooter')
        ?.textContent;

    expect(footerText()).toBe('Account details');

    navigation
      .find('button', {'aria-label': 'Collapse navigation'})
      ?.trigger('onClick');
    expect(footerText()).toBe('Account avatar');

    navigation
      .find('button', {'aria-label': 'Expand navigation'})
      ?.trigger('onClick');
    expect(footerText()).toBe('Account details');
  });

  it('toggles the desktop sidebar and frame spacing from the logo button', () => {
    const navigation = mountWithApp(
      <Frame
        navigation={
          <Navigation location="/">
            <Navigation.Logo logo={<span>Shop</span>} />
            <Navigation.Section items={[{label: 'Orders'}]} />
          </Navigation>
        }
      />,
    );

    const frame = navigation.find('div', {'data-has-navigation': true} as any);
    const nav = navigation.find('nav');

    expect(nav?.domNode?.classList.contains('Navigation-collapsed')).toBe(
      false,
    );
    expect(
      frame?.domNode?.classList.contains('Frame-navigationCollapsed'),
    ).toBe(false);

    navigation
      .find('button', {'aria-label': 'Collapse navigation'})
      ?.trigger('onClick');

    expect(nav?.domNode?.classList.contains('Navigation-collapsed')).toBe(true);
    expect(
      frame?.domNode?.classList.contains('Frame-navigationCollapsed'),
    ).toBe(true);
    expect(nav?.domNode?.querySelector('[aria-label="Orders"]')).not.toBeNull();
    expect(nav?.domNode?.querySelector('.FallbackIcon')?.textContent).toBe('O');
    expect(navigation).toContainReactComponent('button', {
      'aria-label': 'Expand navigation',
      'aria-pressed': true,
    });

    navigation
      .find('button', {'aria-label': 'Expand navigation'})
      ?.trigger('onClick');

    expect(nav?.domNode?.classList.contains('Navigation-collapsed')).toBe(
      false,
    );
    expect(
      frame?.domNode?.classList.contains('Frame-navigationCollapsed'),
    ).toBe(false);
  });

  describe('context', () => {
    it('passes location context', () => {
      const Child: React.FunctionComponent = (_props) => {
        return (
          <NavigationContext.Consumer>
            {({location}) => {
              return location ? <div /> : null;
            }}
          </NavigationContext.Consumer>
        );
      };

      const navigation = mountWithApp(
        <NavigationContext.Provider value={{location: '/'}}>
          <Navigation location="/">
            <Child />
          </Navigation>
        </NavigationContext.Provider>,
      );

      expect(navigation.find(Child)).toContainReactComponent('div');
    });

    it('has a child with contentContext', () => {
      const Child: React.FunctionComponent = (_props) => {
        return (
          <WithinContentContext.Consumer>
            {(withinContentContainer) => {
              return withinContentContainer ? <div /> : null;
            }}
          </WithinContentContext.Consumer>
        );
      };

      const navigation = mountWithApp(
        <Navigation location="/">
          <Child />
        </Navigation>,
      );

      expect(navigation.find(Child)).toContainReactComponentTimes('div', 1);
    });
  });
});
