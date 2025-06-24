import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { Todo } from '../types';

interface Headerprops {
    todos: Todo[];
    todosCollection: FirebaseFirestoreTypes.CollectionReference;
}

const Header: React.FC<Headerprops> = ({ todos, todosCollection }) => {
  console.log(`Rendering Header: ${todos.length}`);
  // Get collection statistics
  const stats = useMemo(() => {
      const total = todos.length;
      const completed = todos.filter((todo: Todo) => todo.completed).length;
      const notCompleted = total - completed;
      return { total, completed, notCompleted };
  }, [todos]);

  // Batch mark all completed
  const markAllCompleted = async () => {
      try {
          const batch = firestore().batch();
          const incompleteTodos = todos.filter((todo: Todo) => !todo.completed);

          incompleteTodos.forEach((todo: Todo) => {
              const todoRef = todosCollection.doc(todo.id);
              batch.update(todoRef, {
                  completed: true,
                  updatedAt: firestore.FieldValue.serverTimestamp(),
              });
          });

          await batch.commit();
          Alert.alert('Success', 'All todos marked as completed!');
      } catch (error) {
          Alert.alert('Error', 'Failed to update todos');
          console.error('Batch update error:', error);
      }
  };

  // Batch clear completed
  const clearCompleted = async () => {
      try {
          const batch = firestore().batch();
          const completedTodos = todos.filter((todo: Todo) => todo.completed);

          completedTodos.forEach((todo: Todo) => {
              const todoRef = todosCollection.doc(todo.id);
              batch.delete(todoRef);
          });

          await batch.commit();
          Alert.alert('Success', 'Completed todos cleared!');
      } catch (error) {
          Alert.alert('Error', 'Failed to clear completed todos');
          console.error('Batch delete error:', error);
      }
  };
  
  return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Todo List</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {stats.total} | Completed: {stats.completed} | Not Completed: {stats.notCompleted}
          </Text>
        </View>
        {todos.length > 0 && (
          <View style={styles.batchActionsContainer}>
            <TouchableOpacity style={styles.batchActionButton} onPress={markAllCompleted}>
              <Text style={styles.batchActionText}>Complete All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.batchActionButton} onPress={clearCompleted}>
              <Text style={styles.batchActionText}>Clear Completed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
    header: {
      backgroundColor: '#6366f1',
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
    },
    statsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    statsText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
    batchActionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    batchActionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    batchActionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
    },
});

export default React.memo(Header);
