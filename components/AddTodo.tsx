import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

interface AddTodoProps {
  newTodo: string;
  setNewTodo: (text: string) => void;
  todosCollection: FirebaseFirestoreTypes.CollectionReference;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AddTodo: React.FC<AddTodoProps> = ({ newTodo, setNewTodo, todosCollection, loading, setLoading }) => {
  console.log(`Rendering AddTodo: ${newTodo}`);
  const addTodo = async () => {
    if (!newTodo.trim()) {
      Alert.alert('Error', 'Please enter a todo item');
      return;
    }
    try {
      setLoading(true);
      const todoData = {
        title: newTodo.trim(),
        completed: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      await todosCollection.add(todoData);
      setNewTodo('');
      Alert.alert('Success', 'Todo added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add todo');
      console.error('Add error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.addTodoContainer}>
      <TextInput
        style={styles.input}
        placeholder="Add a new todo..."
        value={newTodo}
        onChangeText={setNewTodo}
        onSubmitEditing={addTodo}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.addButton, loading && styles.addButtonDisabled]}
        onPress={addTodo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addTodoContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(AddTodo);