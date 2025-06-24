import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Todo, FilterType } from '../types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  filter: FilterType;
  loading: boolean;
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  todosCollection: FirebaseFirestoreTypes.CollectionReference;
}

const TodoList: React.FC<TodoListProps> = ({ todos, filter, loading, refreshing, setRefreshing, todosCollection }) => {
  console.log(`Rendering TodoList: ${todos.length}`);
  console.log('TodoList todosCollection:', todosCollection.path);
  // Fetch todos from Firebase
  const fetchTodos = async () => {
    try {
      setRefreshing(true);
      const snapshot = await todosCollection.orderBy('createdAt', 'desc').get();
      const todosList: Todo[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          completed: data.completed || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
      return todosList;
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch todos');
      console.error('Fetch error:', error);
      return todos;
    } finally {
      setRefreshing(false);
    }
  };

  // Filter todos
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'COMPLETED':
        return todos.filter((todo: Todo) => todo.completed);
      case 'NOT COMPLETED':
        return todos.filter((todo: Todo) => !todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodos();
  }, []);

  if (loading && todos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredTodos}
      renderItem={({ item }) => (
        <TodoItem item={item} todosCollection={todosCollection} />
      )}
      keyExtractor={(item) => item.id}
      style={styles.todoList}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'ALL' ? 'No todos yet!' : `No ${filter.toLowerCase()} todos`}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'ALL' ? 'Add one above to get started' : 'Try a different filter'}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  todoList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default React.memo(TodoList);