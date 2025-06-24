import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Todo, FilterType } from './types';
import Header from './components/Header';
import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';
import FilterBar from './components/FilterBar';

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const todosCollection = useMemo(() => firestore().collection('todos'), []);
  console.log('TodoApp todosCollection:', todosCollection.path);

  // Stabilize setFilter
  const handleSetFilter = useCallback((filter: FilterType) => {
    setFilter(filter);
  }, []);

  // Stabilize setRefreshing
  const handleSetRefreshing = useCallback((refreshing: boolean) => {
    setRefreshing(refreshing);
  }, []);

  // Stabilize setLoading
  const handleSetLoading = useCallback((loading: boolean) => {
    setLoading(loading);
  }, []);

  // Set up real-time listener for todos
  const setupRealtimeListener = () => {
    const unsubscribe = todosCollection
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
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
          setTodos(todosList);
          setLoading(false);
        },
        (error) => {
          console.error('Listener error:', error);
          Alert.alert('Error', 'Failed to sync todos');
        }
      );
    return unsubscribe;
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = setupRealtimeListener();
    return () => unsubscribe();
  }, []);

  console.log('Rendering TodoApp');

  return (
    <View style={styles.container}>
      <Header todos={todos} todosCollection={todosCollection} />
      <AddTodo todosCollection={todosCollection} loading={loading} setLoading={handleSetLoading} />
      <FilterBar filter={filter} setFilter={handleSetFilter} />
      <TodoList
        todos={todos}
        filter={filter}
        loading={loading}
        refreshing={refreshing}
        setRefreshing={handleSetRefreshing}
        todosCollection={todosCollection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default App;