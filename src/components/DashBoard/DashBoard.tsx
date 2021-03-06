import * as React from 'react';
const styles = require('./dashboard.scss');
const Switch = require('react-router-dom').Switch;
import Profile from '../Profile/Profile';
import {observer, inject} from 'mobx-react';
import FilterActivities from '../FilterActivities';
import FollowsPanel from '../FollowsPanel';
import FavoritesPanel from '../FavoritesPanel';
import CommunityContainer from '../Community';
import * as fetchTypes from '../../constants/fetchTypes';
import Activities from '../Activities';
import Playlist from '../Playlist';
import LoadingSpinner from '../LoadingSpinner';
import {getSpecPicPath, PicSize} from '../../services/soundcloundApi';
import Blur from 'react-blur';
import {UserStore, User} from '../../store/UserStore';
import {
  USER_STORE,
  PLAYER_STORE,
  PERFORMANCE_STORE
} from '../../constants/storeTypes';
import {PlayerStore} from '../../store/PlayerStore';
import {PerformanceStore} from '../../store/PerformanceStore';
import {
  FETCH_FOLLOWERS,
  FETCH_FOLLOWINGS,
  FETCH_FAVORITES
} from '../../constants/fetchTypes';
import Route from '../Route/TransitionRoute';
const preload = require('preload.jpg');
const qs = require('qs');
import makeTranslateXMotion from '../../Hoc/makeTranslateXMotion';
import Tabs, {Tab} from '../Tabs';
import {DASH_GENRES} from '../../constants/trackTypes';
import makeBackToTop from '../../Hoc/makeBackToTop';

interface IDashBorardProps {
  userStore: UserStore;
  performanceStore: PerformanceStore;
  playerStore: PlayerStore;
  location?: any;
  match: any;
  history: any;
}

export const BlankView = () => {
  return (
    <div>
      You dont have the permission,Need login;
    </div>
  );
};
@makeTranslateXMotion
@observer
class FavoView extends React.PureComponent<any, any> {
  render() {
    const {performanceStore, userStore} = this.props;
    const {userModel} = userStore;
    const {favorites, isError} = userModel;
    const isloadingFavorites = performanceStore.getLoadingState(
      FETCH_FAVORITES
    );
    const streamStyle = {
      ellipisMaxWidth: performanceStore.windowWidth > 1000 ? 270 : 200
    };
    return (
      <div>
        <p className={styles._songs_tag}>FAVORITES SONGS</p>
        <Activities
          type={FETCH_FAVORITES}
          isError={isError(FETCH_FAVORITES)}
          isLoading={isloadingFavorites}
          scrollFunc={() => userModel.fetchWithType(FETCH_FAVORITES)}
          datas={favorites}
          streamStyle={streamStyle}
        />
      </div>
    );
  }
}

/**
 * 用户界面
 */
@inject(USER_STORE, PLAYER_STORE, PERFORMANCE_STORE)
@observer
class DashBorard extends React.Component<IDashBorardProps, any> {
  id: number;
  infoGlassStyle: {} = {};
  headerInfo: any;
  headerImg: any;
  profile: any;
  state = {tabValue: DASH_GENRES[0]};
  handleTabActive = (value: string, index: number) => {
    const his = this.props.history;
    const {userStore: {userModel}} = this.props;
    if (!userModel) {
      return;
    }
    const {user: {id}} = userModel;
    his.push(`/users/${value.toLocaleLowerCase()}?id=${id}`);
    this.setState({tabValue: value});
  };

  renderContentBodyMain = (
    us: UserStore,
    performanceStore: PerformanceStore
  ) => {
    const {match: {url}} = this.props;

    const {userModel} = us;
    const selectedStyle = '#f55874';
    return (
      <div>
        <div className={styles.dashtabs}>
          <Tabs
            onActive={this.handleTabActive}
            initialSelectedIndex={0}
            inkBarStyle={{background: selectedStyle}}
            selectedTextColor={selectedStyle}
            value={this.state.tabValue}
          >
            {DASH_GENRES.map((item, i) => {
              return <Tab key={`${item} -- ${i}`} label={item} value={item} />;
            })}
          </Tabs>
        </div>

        <Route
          path={`${url}`}
          render={({location}) => {
            {
              /* getDefaultItemStyle={(item, index) => ({ opacity: 0, left: -200, overflow: 'hidden' })}
                         getItemStyle={(item, index) => ({ opacity: spring(1), left: spring(0, presets.gentle) })}
                         willEnter={() => {
                         return ({ left: -200, opacity: 1 })
                         }}
                         willLeave={() => ({ left: spring(-200, presets.gentle), spacity: spring(0, presets.gentle) })}
                         */
            }
            return (
              <div className={styles._contentBody_main}>
                <Switch location={location}>
                  {this.renderCommunityContainer(
                    url,
                    fetchTypes.FETCH_FOLLOWERS
                  )}
                  {this.renderCommunityContainer(
                    url,
                    fetchTypes.FETCH_FOLLOWINGS
                  )}
                  <Route
                    path={`${url}/favorites`}
                    location={location}
                    render={() => {
                      return (
                        <FavoView
                          userStore={us}
                          performanceStore={performanceStore}
                        />
                      );
                    }}
                  />
                  <Route
                    path={`${url}/playlist`}
                    render={(match: any) => {
                      return userModel
                        ? <Playlist
                            scrollFunc={this.handleFetchMorePlaylist}
                            userModel={userModel}
                          />
                        : <LoadingSpinner isLoading={true} />;
                    }}
                  />

                  <Route
                    path={'/'}
                    render={() => {
                      return us.isLoginUser
                        ? <FilterActivities />
                        : <FavoView
                            userStore={us}
                            performanceStore={performanceStore}
                          />;
                    }}
                  />
                </Switch>
              </div>
            );
          }}
        />
      </div>
    );
  };
  renderContentHeader = (user: User, isLoginUser: boolean) => {
    const avatar_url = user.avatar_url;
    let backgroundImageUrl = preload;
    if (Object.keys(this.infoGlassStyle).length > 0) {
      backgroundImageUrl = avatar_url
        ? getSpecPicPath(avatar_url, PicSize.MASTER)
        : backgroundImageUrl;
    }

    return (
      <div className={styles._contentHeader}>
        <div
          ref={n => (this.headerImg = n)}
          className={styles._contentHeader_img}
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            height: '300px'
          }}
        />
        <div
          ref={n => (this.headerInfo = n)}
          className={styles._contentHeader_info}
        >
          <span
            onClick={this.handleRouteToUserMain}
            className={styles._contentHeader_username}
          >
            {user.username}
          </span>
          <div className={styles._contentHeader_actions}>
            <button onClick={this.handlePlayAll}>PLAY</button>
            {isLoginUser
              ? ''
              : <button onClick={this.handleFollow}>
                  {user.isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
                </button>}
          </div>
          <Blur
            className={styles._contentHeader_blur}
            img={backgroundImageUrl}
            blurRadius={5}
            style={this.infoGlassStyle}
          />

        </div>

      </div>
    );
  };

  handlePlayAll = () => {
    if (this.props.userStore.userModel) {
      this.props.playerStore.addToPlaylist(
        this.props.userStore.userModel.favorites
      );
    }
  };

  handlerFetchMoreContacts = (type: string) => {
    const um = this.props.userStore.userModel;
    um && um.fetchWithType(type);
  };

  renderCommunityContainer = (url: string, path: string) => {
    return (
      <Route
        path={`${url}/${path}`}
        render={() => {
          return (
            <CommunityContainer
              path={path}
              scrollFunc={() => this.handlerFetchMoreContacts(path)}
            />
          );
        }}
      />
    );
  };

  handleFollow = () => {
    const {userStore: us} = this.props;
    if (us.userModel) {
      us.debouncedRequestFollowUser(us.userModel.user);
    }
  };

  componentDidMount() {
    this.props.performanceStore.setCurrentGlassNodeId('DashBoard');
    const hi = this.headerInfo;

    this.infoGlassStyle = {
      left: -hi.offsetLeft + 'px',
      top: '-140px',
      height: hi.offsetHeight + 'px',
      width: this.headerImg.offsetWidth + 'px',
      position: 'absolute',
      zIndex: '-9'
    };
    this.forceUpdate();
  }

  componentWillMount() {
    if (this.props.location) {
      const {location: {pathname, search}} = this.props;
      // todo id undefined redicet to other
      const id = +qs.parse(search.substr(1)).id;
      this.changeUserId(id);
      const tabValue = pathname
        .substr(pathname.lastIndexOf('/') + 1)
        .toUpperCase();
      this.setState({tabValue});
    }
  }

  changeUserId(id: number) {
    this.id = id;
    const us = this.props.userStore;
    const userModel = us.initUser(this.id);
    us.setCurrentUserModel(userModel);
    this.setState({tabValue: DASH_GENRES[0]});
  }

  handleRouteToUserMain = () => {
    const {history} = this.props;
    history.push(`/users/home?id=${this.id}`);
  };

  componentDidUpdate(prevProps: any) {
    const loc = this.props.location;
    if (loc.search !== prevProps.location.search) {
      const id = +qs.parse(loc.search.substr(1)).id;
      this.changeUserId(id);
    }
  }

  handleFetchMorePlaylist = () => {
    /** */
  };

  render() {
    if (Number.isNaN(this.id) || this.id == null) {
      // return <Redirect to="/main" />
    }
    const {userStore: us, performanceStore} = this.props;
    const {userModel} = us;
    if (!userModel || !userModel.user) {
      return <LoadingSpinner isLoading={true} />;
    }

    return (
      <div id="DashBoard" className={styles.container}>
        {this.renderContentHeader(userModel.user, us.isLoginUser)}
        <div className={styles._contentBody}>
          {this.renderContentBodyMain(us, performanceStore)}
          <aside className={styles._contentBody_community}>
            <Profile user={userModel.user} />
            <FavoritesPanel
              playerStore={this.props.playerStore}
              UserModel={userModel}
            />
            <FollowsPanel
              type={FETCH_FOLLOWERS}
              onErrorHandler={() => userModel.fetchWithType(FETCH_FOLLOWERS)}
            />
            <FollowsPanel
              type={FETCH_FOLLOWINGS}
              onErrorHandler={() => userModel.fetchWithType(FETCH_FOLLOWINGS)}
            />
          </aside>
        </div>
      </div>
    );
  }
}

export default makeBackToTop(DashBorard);
