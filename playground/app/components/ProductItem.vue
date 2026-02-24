<script setup lang="ts">
import type { Product } from "../utils/mockData";

defineProps<{
  item?: Product;
  style?: any;
}>();
</script>

<template>
  <div :style="style" class="product-item-wrapper">
    <Card v-if="item" class="product-card">
      <template #header>
        <div class="image-container">
          <img :src="item.image" :alt="item.name" class="product-image" loading="lazy" />
          <Tag :value="item.category" class="category-tag" severity="secondary" />
        </div>
      </template>
      <template #title>
        <div class="product-title">{{ item.name }}</div>
      </template>
      <template #content>
        <div class="product-content">
          <span class="product-price">{{ item.price }}</span>
          <span class="product-id mono">{{ item.id.slice(0, 8) }}</span>
        </div>
      </template>
    </Card>

    <div v-else class="placeholder-card">
      <div class="placeholder-image">
        <Skeleton width="100%" height="100%" />
      </div>
      <div class="placeholder-details">
        <Skeleton width="60%" height="1.25rem" class="mb-2" />
        <Skeleton width="40%" height="0.875rem" class="mb-4" />
        <Skeleton width="100%" height="2rem" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-item-wrapper {
  padding: 8px;
  place-self: stretch;
  overflow: hidden;
}

.product-card {
  height: 100%;
  overflow: hidden;
}

.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  min-height: 220px;
  max-height: 300px;
  flex-shrink: 0;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.category-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.product-title {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-content {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.product-price {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
}

.product-id {
  font-size: 0.6875rem;
  color: var(--app-text-muted);
}

/* Placeholder */
.placeholder-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.placeholder-image {
  aspect-ratio: 1;
  min-height: 220px;
  max-height: 300px;
  width: 100%;
  flex-shrink: 0;
}

.placeholder-details {
  flex-grow: 1;
  padding: 0.75rem;
}
</style>
