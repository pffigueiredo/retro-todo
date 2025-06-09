
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (data: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: data.title,
      description: data.description || null,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo completed status', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('Test description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should save updated todo to database', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the todo was actually updated in the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > testTodo.updated_at).toBe(true);
  });

  it('should throw error when todo not found', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/todo with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    // Update only completed status
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify only completed and updated_at changed
    expect(result.title).toEqual(testTodo.title);
    expect(result.description).toEqual(testTodo.description);
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(testTodo.created_at);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });
});
