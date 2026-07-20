import React from 'react'
import BottomSheetBase, { BottomSheetProps, BottomSheetScrollView, BottomSheetFlatList, BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { Dimensions } from "react-native";

interface ScrollViewProps extends Omit<BottomSheetProps, 'type'> {
  type: 'scrollView';
  children: React.ReactNode;
}

interface FlatListProps extends Omit<BottomSheetProps, 'type'> {
  type: 'flatList';
  data: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  keyExtractor: (item: any, index: number) => string;
}

interface SectionListProps extends Omit<BottomSheetProps, 'type'> {
  type: 'sectionList';
  sections: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  renderSectionHeader: ({ section }: { section: any }) => React.ReactElement;
  keyExtractor: (item: any, index: number) => string;
}

type DynamicSizingSheetProps = ScrollViewProps | FlatListProps | SectionListProps;

const DynamicSizingSheet = (props: DynamicSizingSheetProps) => {
  return (
    <BottomSheetBase
      enableDynamicSizing
      enablePanDownToClose
      animateOnMount
      maxDynamicContentSize={Dimensions.get('window').height - 100}
      {...props}
    >
      {props.type === 'scrollView' && (
        <BottomSheetScrollView style={{ minHeight: 10 }}>
          {props.children}
        </BottomSheetScrollView>
      )}
      {props.type === 'flatList' && (
        <BottomSheetFlatList
          data={props.data}
          renderItem={props.renderItem}
          keyExtractor={props.keyExtractor}
          style={{ minHeight: 10 }}
        />
      )}
      {props.type === 'sectionList' && (
        <BottomSheetSectionList
          sections={props.sections}
          renderItem={props.renderItem}
          renderSectionHeader={props.renderSectionHeader}
          keyExtractor={props.keyExtractor}
          style={{ minHeight: 10 }}
        />
      )}
    </BottomSheetBase>
  )
}

export default DynamicSizingSheet