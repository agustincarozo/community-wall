<template>
  <div class="moodboard" :style="containerStyle">
    <div v-if="processedCreations.length === 0" class="empty-state">
      <p class="empty-message">No creations to display</p>
      <p class="empty-hint">Add creations in the component settings</p>
    </div>
    <div v-else class="moodboard-canvas" ref="canvasRef">
      <div
        v-for="(creation, index) in processedCreations"
        :key="creation.id || index"
        class="moodboard-card"
        :class="{ dragging: creation.isDragging }"
        :data-orientation="getCardOrientation()"
        :data-size="getCardSize()"
        :data-content-height="getContentAreaHeight()"
        :style="getCardStyle(creation, index)"
        @mousedown="handleMouseDown($event, creation)"
        @click="handleCardClick(creation, $event)"
      >
        <div class="card-image-wrapper">
          <!-- Loading skeleton -->
          <div
            v-if="creation.image && isImageLoading(`img-${creation.id}`) && !hasImageError(`img-${creation.id}`)"
            class="image-skeleton loading"
          ></div>
          <!-- Image -->
          <img
            v-if="creation.image && !hasImageError(`img-${creation.id}`)"
            :src="creation.image"
            :alt="creation.title || 'Creation'"
            class="card-image"
            :class="{ 'image-loading': isImageLoading(`img-${creation.id}`) }"
            :style="getImageStyle()"
            loading="lazy"
            @load="handleImageLoad(`img-${creation.id}`)"
            @error="(e) => handleImageError(e, `img-${creation.id}`, creation.image)"
            @loadstart="handleImageLoadStart(`img-${creation.id}`, creation.image)"
          />
          <!-- Placeholder when no image or error -->
          <div v-if="!creation.image || hasImageError(`img-${creation.id}`)" class="image-placeholder">
            <span class="placeholder-icon">📸</span>
          </div>
        </div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-avatar">
              <img
                v-if="creation.avatar && !hasImageError(`avatar-${creation.id}`)"
                :src="creation.avatar"
                :alt="creation.title || 'Creator'"
                class="avatar-image"
                @error="(e) => handleImageError(e, `avatar-${creation.id}`, creation.avatar)"
              />
              <div v-else class="avatar-placeholder">
                <span class="avatar-initial">{{ getInitial(creation.title) }}</span>
              </div>
            </div>
            <div class="card-header-text">
              <h3 class="card-title">{{ creation.title || "Untitled" }}</h3>
            </div>
          </div>
          <p class="card-description">{{ creation.description || "No description" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, nextTick } from "vue";

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ["trigger-event"],
  setup(props, { emit }) {
    /* wwEditor:start */
    const isEditing = computed(() => {
      return props.wwEditorState?.isEditing || false;
    });
    /* wwEditor:end */

    const canvasRef = ref(null);
    const cardPositions = ref(new Map());
    const draggedCard = ref(null);
    const dragOffset = ref({ x: 0, y: 0 });
    const isDragging = ref(false);
    const hasDragged = ref(false);
    const justFinishedDrag = ref(false);

    // Track image loading states
    const imageLoadingStates = ref(new Map());
    const imageErrorStates = ref(new Set());
    const imageTimeouts = ref(new Map());

    // Get wwLib for utilities
    const wwLib = window.wwLib || {};

    // Timeout handler for slow-loading images
    const setImageTimeout = (imageKey, imageUrl, timeoutMs = 10000) => {
      if (imageTimeouts.value.has(imageKey)) {
        clearTimeout(imageTimeouts.value.get(imageKey));
      }

      const timeout = setTimeout(() => {
        if (imageLoadingStates.value.get(imageKey) === true) {
          imageLoadingStates.value.set(imageKey, false);
          imageErrorStates.value.add(imageKey);
        }
        imageTimeouts.value.delete(imageKey);
      }, timeoutMs);

      imageTimeouts.value.set(imageKey, timeout);
    };

    // Pre-check if image is already loaded (for cached images)
    const checkImageLoaded = (imageUrl, imageKey) => {
      if (!imageUrl) return;

      const img = new Image();
      img.onload = () => {
        imageLoadingStates.value.set(imageKey, false);
      };
      img.onerror = () => {
        // Will be handled by error handler
      };
      img.src = imageUrl;
    };

    // Process creations with formula mapping
    const processedCreations = computed(() => {
      const creations = props.content?.creations || [];
      const { resolveMappingFormula } =
        wwLib.wwFormula?.useFormula?.() || {};

      let processed = [];

      if (!resolveMappingFormula) {
        processed = creations.map((item, index) => ({
          id: item.id || `creation-${index}`,
          title: item.title || item.name || "Untitled",
          description: item.description || item.desc || item.text || "",
          image: item.image || item.screenshot || item.photo || "",
          avatar: item.avatar || item.userAvatar || item.photo || "",
          url: item.url || item.link || "",
          originalItem: item,
        }));
      } else {
        processed = creations.map((item, index) => {
          const id =
            resolveMappingFormula(props.content?.creationIdFormula, item) ??
            item.id ??
            `creation-${index}`;
          const title =
            resolveMappingFormula(props.content?.creationTitleFormula, item) ??
            item.title ??
            item.name ??
            "Untitled";
          const description =
            resolveMappingFormula(
              props.content?.creationDescriptionFormula,
              item
            ) ??
            item.description ??
            item.desc ??
            item.text ??
            "";
          const image =
            resolveMappingFormula(props.content?.creationImageFormula, item) ??
            item.image ??
            item.screenshot ??
            item.photo ??
            "";
          const avatar =
            resolveMappingFormula(props.content?.creationAvatarFormula, item) ??
            item.avatar ??
            item.userAvatar ??
            item.photo ??
            "";
          const url =
            resolveMappingFormula(props.content?.creationUrlFormula, item) ??
            item.url ??
            item.link ??
            "";

          return {
            id,
            title,
            description,
            image,
            avatar,
            url,
            originalItem: item,
          };
        });
      }

      // Initialize loading states for new images
      processed.forEach((creation) => {
        if (creation.image && !imageLoadingStates.value.has(`img-${creation.id}`)) {
          checkImageLoaded(creation.image, `img-${creation.id}`);
        }
      });

      return processed;
    });

    // Get size multiplier
    const getSizeMultiplier = () => {
      const size = props.content?.cardSize || "medium";
      const multipliers = {
        small: 0.75,
        medium: 1.0,
        large: 1.25,
        xlarge: 1.5,
      };
      return multipliers[size] || 1.0;
    };

    // Get card orientation for template
    const getCardOrientation = () => {
      return props.content?.cardOrientation || "vertical";
    };

    // Get card size for template
    const getCardSize = () => {
      return props.content?.cardSize || "medium";
    };

    // Get content area height for template
    const getContentAreaHeight = () => {
      return props.content?.contentAreaHeight || "medium";
    };

    // Initialize random positions for cards
    const initializePositions = () => {
      if (!canvasRef.value) return;

      const canvas = canvasRef.value;
      const canvasRect = canvas.getBoundingClientRect();
      const orientation = props.content?.cardOrientation || "vertical";
      const sizeMultiplier = getSizeMultiplier();
      
      // Get base dimensions
      let baseWidth, baseHeight;
      if (orientation === "landscape") {
        baseWidth = parseInt(props.content?.landscapeCardWidth || "500px");
        baseHeight = parseInt(props.content?.landscapeCardHeight || "300px");
      } else {
        baseWidth = parseInt(props.content?.cardWidth || "280px");
        baseHeight = parseInt(props.content?.cardHeight || "350px");
      }
      
      // Apply size multiplier
      const cardWidth = baseWidth * sizeMultiplier;
      const cardHeight = baseHeight * sizeMultiplier;

      processedCreations.value.forEach((creation, index) => {
        if (!cardPositions.value.has(creation.id)) {
          // Random position within canvas bounds
          const maxX = Math.max(0, canvasRect.width - cardWidth - 40);
          const maxY = Math.max(0, canvasRect.height - cardHeight - 40);

          const x = Math.random() * maxX + 20;
          const y = Math.random() * maxY + 20;

          cardPositions.value.set(creation.id, { x, y });
        }

      });
    };

    // Store rotation per card for consistency
    const cardRotations = ref(new Map());

    // Get card style with position and rotation
    const getCardStyle = (creation, index) => {
      const position = cardPositions.value.get(creation.id) || { x: 0, y: 0 };
      const orientation = props.content?.cardOrientation || "vertical";
      const sizeMultiplier = getSizeMultiplier();
      
      // Get base card dimensions based on orientation
      let baseWidth, baseHeight;
      if (orientation === "landscape") {
        baseWidth = parseInt(props.content?.landscapeCardWidth || "500px");
        baseHeight = parseInt(props.content?.landscapeCardHeight || "300px");
      } else {
        baseWidth = parseInt(props.content?.cardWidth || "280px");
        baseHeight = parseInt(props.content?.cardHeight || "350px");
      }
      
      // Apply size multiplier
      const cardWidth = `${baseWidth * sizeMultiplier}px`;
      const cardHeight = `${baseHeight * sizeMultiplier}px`;

      // Get or set rotation for this card
      if (!cardRotations.value.has(creation.id)) {
        let rotation = 0;
        if (props.content?.randomRotation !== false) {
          const maxRotation = props.content?.maxRotation || 8;
          // Use index for consistent rotation per card
          rotation = (Math.sin(index * 2.3) * maxRotation).toFixed(2);
        }
        cardRotations.value.set(creation.id, rotation);
      }
      
      const rotation = cardRotations.value.get(creation.id) || 0;
      const isDragging = creation.isDragging || false;

      const shadowEnabled = props.content?.cardShadow !== false;

      // Get font sizes from props
      const titleFontSize = props.content?.titleFontSize || "18px";
      const descriptionFontSize = props.content?.descriptionFontSize || "14px";

      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: cardWidth,
        height: cardHeight,
        transform: isDragging ? `rotate(${rotation}deg) scale(1.05)` : `rotate(${rotation}deg)`,
        boxShadow: shadowEnabled
          ? isDragging
            ? "0 16px 32px rgba(0, 0, 0, 0.25)"
            : "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)"
          : "none",
        "--title-font-size": titleFontSize,
        "--description-font-size": descriptionFontSize,
      };
    };

    // Get initial letter for avatar placeholder
    const getInitial = (name) => {
      if (!name || typeof name !== "string") return "?";
      return name.charAt(0).toUpperCase();
    };

    // Get image style with fit option
    const getImageStyle = () => {
      return {
        objectFit: props.content?.imageFit || "cover",
      };
    };

    // Handle mouse down for drag
    const handleMouseDown = (event, creation) => {
      if (!props.content?.enableDragDrop) return;

      // Don't start drag on click of content area
      if (
        event.target.classList.contains("card-title") ||
        event.target.classList.contains("card-description") ||
        event.target.classList.contains("card-avatar") ||
        event.target.classList.contains("avatar-image")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      hasDragged.value = false;
      isDragging.value = false;
      justFinishedDrag.value = false;
      draggedCard.value = creation;
      creation.isDragging = true;

      const canvas = canvasRef.value;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const cardRect = event.currentTarget.getBoundingClientRect();

      // Calculate offset from mouse to card top-left
      dragOffset.value = {
        x: event.clientX - cardRect.left,
        y: event.clientY - cardRect.top,
      };

      // Add global mouse move and up handlers
      const frontDocument = wwLib.getFrontDocument?.() || document;

      const handleMouseMove = (e) => {
        if (!draggedCard.value) return;

        // Check if mouse moved enough to consider it a drag
        const deltaX = Math.abs(e.clientX - event.clientX);
        const deltaY = Math.abs(e.clientY - event.clientY);
        
        if (deltaX > 5 || deltaY > 5) {
          hasDragged.value = true;
          isDragging.value = true;
        }

        if (hasDragged.value) {
          const newX = e.clientX - canvasRect.left - dragOffset.value.x;
          const newY = e.clientY - canvasRect.top - dragOffset.value.y;

          const orientation = props.content?.cardOrientation || "vertical";
          const sizeMultiplier = getSizeMultiplier();
          
          // Get base dimensions
          let baseWidth, baseHeight;
          if (orientation === "landscape") {
            baseWidth = parseInt(props.content?.landscapeCardWidth || "500px");
            baseHeight = parseInt(props.content?.landscapeCardHeight || "300px");
          } else {
            baseWidth = parseInt(props.content?.cardWidth || "280px");
            baseHeight = parseInt(props.content?.cardHeight || "350px");
          }
          
          // Apply size multiplier
          const cardWidth = baseWidth * sizeMultiplier;
          const cardHeight = baseHeight * sizeMultiplier;

          // Constrain to canvas bounds
          const maxX = Math.max(0, canvasRect.width - cardWidth);
          const maxY = Math.max(0, canvasRect.height - cardHeight);

          const constrainedX = Math.max(0, Math.min(newX, maxX));
          const constrainedY = Math.max(0, Math.min(newY, maxY));

          cardPositions.value.set(draggedCard.value.id, {
            x: constrainedX,
            y: constrainedY,
          });
        }
      };

      const handleMouseUp = (e) => {
        if (draggedCard.value) {
          const wasDragging = hasDragged.value && isDragging.value;
          
          if (wasDragging) {
            // Emit drag event only if actually dragged
            const position = cardPositions.value.get(draggedCard.value.id);
            emit("trigger-event", {
              name: "card-drag",
              event: {
                creationId: draggedCard.value.id,
                title: draggedCard.value.title,
                position: position || { x: 0, y: 0 },
              },
            });
            
            // Mark that we just finished a drag to prevent click
            justFinishedDrag.value = true;
            
            // Clear the flag after a delay to allow next click
            setTimeout(() => {
              justFinishedDrag.value = false;
            }, 300);
          }

          // Clear dragging state immediately
          const cardId = draggedCard.value.id;
          draggedCard.value.isDragging = false;
          draggedCard.value = null;
          hasDragged.value = false;
          isDragging.value = false;
          
          // Force reactivity update by finding the creation and updating it
          const creation = processedCreations.value.find(c => c.id === cardId);
          if (creation) {
            creation.isDragging = false;
          }
        }

        frontDocument.removeEventListener("mousemove", handleMouseMove);
        frontDocument.removeEventListener("mouseup", handleMouseUp);
      };

      frontDocument.addEventListener("mousemove", handleMouseMove);
      frontDocument.addEventListener("mouseup", handleMouseUp);
    };

    // Handle card click
    const handleCardClick = (creation, event) => {
      // Don't navigate if we just finished dragging
      if (justFinishedDrag.value) {
        return;
      }

      // Don't navigate if we dragged (even if flag not set yet)
      if (hasDragged.value) {
        return;
      }

      // Don't navigate if currently dragging
      if (isDragging.value || creation.isDragging) {
        return;
      }

      // Don't navigate if clicking on interactive elements
      if (
        event?.target?.classList.contains("card-title") ||
        event?.target?.classList.contains("card-description") ||
        event?.target?.classList.contains("card-avatar") ||
        event?.target?.classList.contains("avatar-image")
      ) {
        return;
      }

      // Emit click event
      emit("trigger-event", {
        name: "card-click",
        event: {
          creationId: creation.id,
          title: creation.title,
          url: creation.url,
        },
      });

      // Navigate to URL if available
      if (creation.url) {
        const frontWindow = wwLib.getFrontWindow?.();
        if (frontWindow) {
          frontWindow.open(creation.url, "_blank");
        } else if (typeof window !== "undefined") {
          window.open(creation.url, "_blank");
        }
      }
    };

    // Image loading handlers
    const handleImageLoadStart = (imageKey, imageUrl) => {
      if (
        !imageLoadingStates.value.has(imageKey) ||
        imageLoadingStates.value.get(imageKey) !== false
      ) {
        imageLoadingStates.value.set(imageKey, true);
      }
      imageErrorStates.value.delete(imageKey);

      if (imageUrl) {
        setImageTimeout(imageKey, imageUrl, 10000);
      }
    };

    const handleImageLoad = (imageKey) => {
      if (imageTimeouts.value.has(imageKey)) {
        clearTimeout(imageTimeouts.value.get(imageKey));
        imageTimeouts.value.delete(imageKey);
      }

      imageLoadingStates.value.set(imageKey, false);
      imageErrorStates.value.delete(imageKey);
    };

    const handleImageError = (event, imageKey, imageUrl, retryCount = 0) => {
      if (imageTimeouts.value.has(imageKey)) {
        clearTimeout(imageTimeouts.value.get(imageKey));
        imageTimeouts.value.delete(imageKey);
      }

      if (event?.target) {
        imageLoadingStates.value.set(imageKey, false);
        imageErrorStates.value.add(imageKey);

        if (retryCount < 1 && imageUrl) {
          setTimeout(() => {
            const img = new Image();
            img.onload = () => {
              if (event.target) {
                event.target.src = imageUrl;
                handleImageLoad(imageKey);
              }
            };
            img.onerror = () => {
              handleImageError(event, imageKey, imageUrl, retryCount + 1);
            };
            img.src = imageUrl;
          }, 2000 * (retryCount + 1));
        } else {
          if (event.target) {
            event.target.style.display = "none";
          }
        }
      }
    };

    const isImageLoading = (imageKey) => {
      return imageLoadingStates.value.get(imageKey) === true;
    };

    const hasImageError = (imageKey) => {
      return imageErrorStates.value.has(imageKey);
    };

    // Container styles
    const containerStyle = computed(() => ({
      "--background-color": props.content?.backgroundColor || "#f5f5f3",
      backgroundColor: "var(--background-color)",
    }));

    // Initialize positions when component mounts or creations change
    onMounted(() => {
      nextTick(() => {
        initializePositions();
      });
    });

    watch(
      processedCreations,
      () => {
        nextTick(() => {
          initializePositions();
        });
      },
      { deep: true }
    );

    // Watch for canvas resize and orientation/size changes
    watch(
      () => [
        props.content?.cardWidth,
        props.content?.cardHeight,
        props.content?.cardOrientation,
        props.content?.landscapeCardWidth,
        props.content?.landscapeCardHeight,
        props.content?.cardSize,
      ],
      () => {
        nextTick(() => {
          initializePositions();
        });
      }
    );

    return {
      canvasRef,
      processedCreations,
      containerStyle,
      getCardStyle,
      getInitial,
      getImageStyle,
      getCardOrientation,
      getCardSize,
      getContentAreaHeight,
      handleMouseDown,
      handleCardClick,
      handleImageLoadStart,
      handleImageLoad,
      handleImageError,
      isImageLoading,
      hasImageError,
      /* wwEditor:start */
      isEditing,
      /* wwEditor:end */
    };
  },
};
</script>

<style lang="scss" scoped>
.moodboard {
  width: 100%;
  min-height: 600px;
  background: var(--background-color);
  position: relative;
  overflow: auto;
  padding: 60px 40px;
  box-sizing: border-box;
  
  // Subtle texture/pattern for moodboard feel
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

.moodboard-canvas {
  position: relative;
  width: 100%;
  min-height: 600px;
  height: 100%;
  z-index: 1;
}

.moodboard-card {
  position: absolute;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  cursor: grab;
  transition: transform 0.3s ease, box-shadow 0.3s ease, z-index 0s;
  user-select: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;

  // Pasted photo effect - slight border and shadow
  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    pointer-events: none;
    z-index: -1;
  }

  &:hover:not(.dragging) {
    transform: scale(1.15) !important;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2),
      0 8px 16px rgba(0, 0, 0, 0.15) !important;
    z-index: 10;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  &.dragging {
    z-index: 1000;
    cursor: grabbing;
    transition: none !important;
  }
  
  &:not(.dragging) {
    transition: transform 0.3s ease, box-shadow 0.3s ease, z-index 0s;
  }

  &:active {
    cursor: grabbing;
  }
}

.card-image-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  flex: 1;
  min-height: 0;
}

// Content area height adjustments
.moodboard-card[data-content-height="small"] {
  .card-image-wrapper {
    flex: 4; // 80% of space
  }
  
  .card-content {
    flex: 1; // 20% of space
    padding: 12px 16px;
  }
}

.moodboard-card[data-content-height="medium"] {
  .card-image-wrapper {
    flex: 2.33; // ~70% of space (7/10)
  }
  
  .card-content {
    flex: 1; // ~30% of space (3/10)
    padding: 16px;
  }
}

.moodboard-card[data-content-height="large"] {
  .card-image-wrapper {
    flex: 1.5; // 60% of space
  }
  
  .card-content {
    flex: 1; // 40% of space
    padding: 16px;
  }
}

.moodboard-card[data-content-height="xlarge"] {
  .card-image-wrapper {
    flex: 1; // 50% of space
  }
  
  .card-content {
    flex: 1; // 50% of space
    padding: 20px;
  }
}

// Landscape orientation adjustments
.moodboard-card[data-orientation="landscape"] {
  .card-header {
    margin-bottom: 6px;
  }
  
  .card-title {
    // Use CSS variable, but allow smaller default for landscape
    font-size: var(--title-font-size, 16px);
    -webkit-line-clamp: 1;
  }
  
  .card-description {
    // Use CSS variable, but allow smaller default for landscape
    font-size: var(--description-font-size, 13px);
    -webkit-line-clamp: 2;
  }
  
  // Apply content area height to landscape - override defaults
  &[data-content-height="small"] {
    .card-image-wrapper {
      flex: 4; // 80% of space
    }
    
    .card-content {
      flex: 1; // 20% of space
      padding: 12px 16px;
    }
  }
  
  &[data-content-height="medium"] {
    .card-image-wrapper {
      flex: 2.33; // ~70% of space
    }
    
    .card-content {
      flex: 1; // ~30% of space
      padding: 12px 16px;
    }
  }
  
  &[data-content-height="large"] {
    .card-image-wrapper {
      flex: 1.5; // 60% of space
    }
    
    .card-content {
      flex: 1; // 40% of space
      padding: 16px;
    }
  }
  
  &[data-content-height="xlarge"] {
    .card-image-wrapper {
      flex: 1; // 50% of space
    }
    
    .card-content {
      flex: 1; // 50% of space
      padding: 20px;
    }
  }
  
  // Default if no content-height is set (backward compatibility)
  &:not([data-content-height]) {
    .card-image-wrapper {
      flex: 3; // 75% of space
    }
    
    .card-content {
      flex: 1; // 25% of space
      padding: 12px 16px;
    }
  }
}

// Size-based scaling for avatars only (images scale with card size)
.moodboard-card[data-size="small"] {
  .card-avatar {
    width: 27px;
    height: 27px;
  }
  
  .avatar-initial {
    font-size: 12px;
  }
}

.moodboard-card[data-size="large"] {
  .card-avatar {
    width: 45px;
    height: 45px;
  }
  
  .avatar-initial {
    font-size: 20px;
  }
}

.moodboard-card[data-size="xlarge"] {
  .card-avatar {
    width: 54px;
    height: 54px;
  }
  
  .avatar-initial {
    font-size: 24px;
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 1;
  transition: opacity 0.3s ease;

  &.image-loading {
    opacity: 0.6;
  }

  &.image-error {
    display: none;
  }
}

.image-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  z-index: 2;

  &.loading {
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
}

.placeholder-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  overflow: visible;
  min-height: 0;
  flex-shrink: 0;
  background: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.card-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: #f0f0f0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.avatar-initial {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
}

.card-header-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--title-font-size, 18px);
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-description {
  font-size: var(--description-font-size, 14px);
  color: #666;
  margin: 0;
  line-height: 1.4;
  overflow: visible;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
  min-height: 0;
}


// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  min-height: 400px;
  position: relative;
  z-index: 1;
}

.empty-message {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.empty-hint {
  font-size: 16px;
  color: #999;
  margin: 0;
  font-weight: 500;
}

// Editor-specific styles
/* wwEditor:start */
/* No special editor styles */
/* wwEditor:end */
</style>
