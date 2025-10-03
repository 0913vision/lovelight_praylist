import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import PullToRefreshNative from './PullToRefreshNative';
import PullToRefreshWeb from './PullToRefreshWeb';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactElement;
  threshold?: number;
}

export interface PullToRefreshRef {
  triggerRefresh: () => void;
}

const PullToRefresh = forwardRef<PullToRefreshRef, PullToRefreshProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <PullToRefreshWeb ref={ref} {...props} />;
  }

  return <PullToRefreshNative ref={ref} {...props} />;
});

export default PullToRefresh;
