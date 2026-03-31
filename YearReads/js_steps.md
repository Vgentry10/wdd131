# JavaScript Steps for YearReads

## 1. Get the book data
- Load `books.json` with `fetch()`
- Save the data in a `books` array

## 2. Show books on the page
- Loop through the array
- Create a card for each book (cover, title, author, rating, progress)
- Add the cards to the books section

## 3. Add search and filters
- Search by title or author
- Filter by genre and reading status
- Update the book list whenever the user changes a filter

## 4. Add sorting
- Sort by title, rating, or date
- Re-render the list after sorting

## 5. Add book detail modal
- Open modal when a card is clicked
- Show full details (notes, stars, progress)
- Close with close button, backdrop click, or `Escape`

## 6. Save user changes
- Let users edit notes, rating, and progress
- Save those values in `localStorage`
- Reload saved values when the page opens

## 7. Add theme and view toggle
- Toggle light/dark mode
- Toggle grid/list view
- Save both preferences in `localStorage`

## 8. Final checks
- Make sure search, filters, sort, and modal all work
- Check that saved data stays after refresh
- Fix any console errors
