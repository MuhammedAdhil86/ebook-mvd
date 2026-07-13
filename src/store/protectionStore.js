import { create } from 'zustand';

/**
 * Zustand store to manage book protection status.
 * This stores the IDs of all books that have 'is_protected: true'.
 */
export const useProtectedStore = create((set, get) => ({
  // We use a Set for O(1) performance when checking if a book is protected
  protectedIds: new Set(),

  /**
   * Initialize or update the store with a list of books.
   * Filters the incoming data for any book where is_protected is true.
   */
  setProtectedBooks: (books) => {
    const protectedIds = new Set(
      books
        .filter((book) => book.is_protected === true)
        .map((book) => book.id)
    );
    set({ protectedIds });
  },

  /**
   * A helper function to check if a specific book ID is protected.
   * Call this from your components to decide whether to block actions.
   */
  isBookProtected: (bookId) => {
    return get().protectedIds.has(bookId);
  },

  /**
   * Optional: Add a single book to the protected list (useful if fetching 
   * a single book detail individually).
   */
  addProtectedBook: (bookId) => {
    set((state) => ({
      protectedIds: new Set(state.protectedIds).add(bookId),
    }));
  }
}));