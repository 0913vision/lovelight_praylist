declare module 'react-native-wrapped-text' {
  import { Component, ReactNode } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  export interface IProps {
    children?: ReactNode;
    containerStyle?: ViewStyle;
    rowWrapperStyle?: ViewStyle;
    textStyle?: TextStyle;
  }

  export default class WrappedText extends Component<IProps> {}
}
