import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

// Firebase imports
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date | FirebaseFirestoreTypes.Timestamp;
  updatedAt?: Date | FirebaseFirestoreTypes.Timestamp;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'NOT COMPLETED'>('ALL');
  const todosCollection = firestore().collection('todos');
  const [refreshing, setRefreshing] = useState(false);



  // Fetch todos from Firebase
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const snapshot = await todosCollection
        .orderBy('createdAt', 'desc')
        .get();
      
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
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch todos');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  // Add new todo to Firebase
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

  // Toggle todo completion status in Firebase
  const toggleTodo = async (id: string) => {
    try {
      const todoDoc = todosCollection.doc(id);
      const todoSnapshot = await todoDoc.get();
      const todoData = todoSnapshot.data() as Todo | undefined;
      
      if (todoData) {
        await todoDoc.update({
          completed: !todoData.completed,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
      console.error('Update error:', error);
    }
  };

  // Delete todo from Firebase
  const deleteTodo = async (id: string) => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
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

  // Batch operations for multiple todos
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

  // Delete all completed todos
  const clearCompleted = async () => {
    const completedTodos = todos.filter((todo: Todo) => todo.completed);
    
    if (completedTodos.length === 0) {
      Alert.alert('Info', 'No completed todos to clear');
      return;
    }

    Alert.alert(
      'Clear Completed',
      `Delete ${completedTodos.length} completed todo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = firestore().batch();
              
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
          },
        },
      ]
    );
  };

  // Filter todos based on current filter
  const getFilteredTodos = () => {
    switch (filter) {
      case 'COMPLETED':
        return todos.filter((todo: Todo) => todo.completed);
      case 'NOT COMPLETED':
        return todos.filter((todo: Todo) => !todo.completed);
      default:
        return todos;
    }
  };

  // Get filter statistics
  const getStats = () => {
    const total = todos.length;
    const completed = todos.filter((todo: Todo) => todo.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTodos();
  };

  // Set up Firebase listener on component mount
  useEffect(() => {
    setLoading(true);
    const unsubscribe = setupRealtimeListener();
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Format date for display
  const formatDate = (timestamp?: Date | FirebaseFirestoreTypes.Timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString();
  };

  // Render individual todo item
  const renderTodoItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
        onPress={() => toggleTodo(item.id)}
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
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const stats = getStats();
  const filteredTodos = getFilteredTodos();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Todo List</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {stats.total} | Completed: {stats.completed} | Not Completed: {stats.pending}
          </Text>
        </View>
        
        {/* Batch Actions */}
        {todos.length > 0 && (
          <View style={styles.batchActionsContainer}>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={markAllCompleted}
            >
              <Text style={styles.batchActionText}>Complete All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={clearCompleted}
            >
              <Text style={styles.batchActionText}>Clear Completed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Todo Section */}
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

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['ALL', 'NOT COMPLETED', 'COMPLETED'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive,
              ]}
            >
              {filterType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={[styles.connectionDot, { backgroundColor: '#10b981' }]} />
        <Text style={styles.connectionText}>Real-time sync enabled</Text>
      </View>

      {/* Todo List */}
      {loading && todos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading todos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          renderItem={renderTodoItem}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  todoList: {
    flex: 1,
  },
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

export default TodoApp;