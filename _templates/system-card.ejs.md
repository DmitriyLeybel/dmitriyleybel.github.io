```{=html}
<div class="system-grid list">
<% for (const item of items) { %>
  <article class="card frost-pane" <%= metadataAttrs(item) %>>
    <% if (item.image) { %>
    <div class="thumb">
      <img src="<%- item.image %>" alt="" />
    </div>
    <% } %>
    <div class="system-card-body">
      <div class="system-card-head">
        <h3 class="display listing-title">
```
<%= item.title %>
```{=html}
        </h3>
        <% if (item.status) { %>
        <span class="chip listing-status"><%= item.status %></span>
        <% } %>
      </div>
      <% if (item.description) { %>
      <p class="listing-description"><%= item.description %></p>
      <% } %>
      <% if (item.categories && item.categories.length) { %>
      <div class="system-card-chips">
        <% for (const cat of item.categories) { %>
        <span class="chip"><%= cat %></span>
        <% } %>
      </div>
      <% } %>
      <% if (item.repo || item.live) { %>
      <div class="system-card-links">
        <% if (item.repo) { %>
        <a class="ink-link" href="<%- item.repo %>">Repo</a>
        <% } %>
        <% if (item.live) { %>
        <a class="ink-link" href="<%- item.live %>">Live</a>
        <% } %>
      </div>
      <% } %>
    </div>
  </article>
<% } %>
</div>
```
