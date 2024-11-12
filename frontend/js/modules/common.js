// Return the first element that matches a query selector
export const $ = document.querySelector.bind(document)

// Return all elements that match a query selector
export const $$ = document.querySelectorAll.bind(document)
