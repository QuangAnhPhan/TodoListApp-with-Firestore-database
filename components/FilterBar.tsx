import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FilterType } from '../types';

interface FilterBarProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filter, setFilter }) => {
  console.log(`Rendering FilterBar: ${filter}`);
  return (
    <View style={styles.filterContainer}>
      {(['ALL', 'NOT COMPLETED', 'COMPLETED'] as const).map((filterType) => (
        <TouchableOpacity
          key={filterType}
          style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
          onPress={() => setFilter(filterType)}
        >
          <Text
            style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}
          >
            {filterType}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
});

export default React.memo(FilterBar);