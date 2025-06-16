import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { Todo } from '../types';

interface TodoItemProps {
    item: Todo;
    todosCollection: FirebaseFirestoreTypes.CollectionReference;
}

const TodoItem: React.FC<TodoItemProps> = ({ item, todosCollection }) => {
  console.log(`Rendering TodoItem: ${item.id}`);
  // Format date
  const formatDate = (timestamp? : Date | FirebaseFirestoreTypes.Timestamp) => {
      if (!timestamp) return 'Just now';
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return date.toLocaleDateString();
  };

  // Toggle todo completion
  const toggleTodo = async (id: string) => {
      try {
          const todoDoc = todosCollection.doc(id);
          const todoSnapshot = await todoDoc.get();
          const todoData = todoSnapshot.data() as Todo | undefined
          if (todoData) {
              await todoDoc.update({
                  completed: !todoData.completed,
                  updatedAt: firestore.FieldValue.serverTimestamp(),
              })
          }
      } catch (error) {
          Alert.alert('Error', 'Failed to update todo');
          console.error('Update error:', error);
      }
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
      Alert.alert(
          'Delete Todo',
          'Are you sure you want to delete this todo ?',
          [
              {
                  text: 'Cancel',
                  style: 'cancel',
              },
              {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                      try {
                          await todosCollection.doc(id).delete();
                          Alert.alert('Success', 'Todo deleted successfully!');
                      } catch (error) {
                          Alert.alert('Error', 'Failed to delete todo');
                          console.error('Delete error:', error);
                      }
                  },
              },
          ]
      );
  };

  // Debug onPress
  const onTogglePress = () => {
    console.log('Toggle button pressed for todo:', item.id);
    toggleTodo(item.id);
  };

  const onDeletePress = () => {
    console.log('Delete button pressed for todo:', item.id);
    deleteTodo(item.id);
  };

  return (
      <View style={styles.todoItem}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
          onPress={onTogglePress}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.todoContent}>
          <Text style={[styles.todoTitle, item.completed && styles.todoTitleCompleted]}>
            {item.title}
          </Text>
          <Text style={styles.todoDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={onDeletePress}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
  );
};

const styles = StyleSheet.create({
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  todoDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
});

export default React.memo(TodoItem);
