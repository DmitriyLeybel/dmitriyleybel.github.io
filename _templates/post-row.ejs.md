```{=html}
<div class="row-list list">
<% if (!items.length) { %>
  <div class="row">
    <div class="row-date">No posts yet</div>
    <div>
      <div class="row-title display">Nothing published here yet</div>
      <p class="row-deck">When a post ships, it will show up with a date, a title, and a one-line deck.</p>
    </div>
  </div>
<% } %>
<% for (const item of items) { %>
  <a class="row" href="<%- item.path %>" <%= metadataAttrs(item) %>>
    <div class="row-date listing-date"><%= item.date %></div>
    <div>
      <div class="row-title display listing-title">
```
<%= item.title %>
```{=html}
      </div>
      <% if (item.description) { %>
      <p class="row-deck listing-description"><%= item.description %></p>
      <% } %>
      <% if (item.categories && item.categories.length) { %>
      <div class="row-chips">
        <% for (const cat of item.categories) { %>
        <span class="chip"><%= cat %></span>
        <% } %>
      </div>
      <% } %>
    </div>
  </a>
<% } %>
</div>
```
