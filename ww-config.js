export default {
  editor: {
    label: {
      en: "Community Moodboard 2025",
    },
    icon: "wwi wwi-grid",
  },
  properties: {
    // Community creations array
    creations: {
      label: { en: "Community Creations" },
      type: "Array",
      section: "settings",
      bindable: true,
      defaultValue: [
        {
          id: `creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: "Amazing App",
          description: "A beautiful app built by our community",
          image: "https://via.placeholder.com/400",
          avatar: "https://via.placeholder.com/100",
          url: "https://example.com/app1",
        },
        {
          id: `creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: "Creative Project",
          description: "An innovative solution for modern problems",
          image: "https://via.placeholder.com/400",
          avatar: "https://via.placeholder.com/100",
          url: "https://example.com/app2",
        },
      ],
      options: {
        expandable: true,
        getItemLabel(item) {
          return (
            item.title ||
            item.name ||
            item.label ||
            `Creation ${item.id || "Unknown"}`
          );
        },
        item: {
          type: "Object",
          defaultValue: () => ({
            id: `creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: "New Creation",
            description: "Description of the creation",
            image: "",
            avatar: "",
            url: "",
          }),
          options: {
            item: {
              id: { label: { en: "ID" }, type: "Text" },
              title: { label: { en: "Title" }, type: "Text" },
              description: { label: { en: "Description" }, type: "Text" },
              image: { label: { en: "Image URL" }, type: "Text" },
              avatar: { label: { en: "Creator Avatar URL" }, type: "Text" },
              url: { label: { en: "URL" }, type: "Text" },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: "array",
        tooltip: "Array of community creations with images and descriptions",
      },
      /* wwEditor:end */
    },

    // Formula properties for dynamic field mapping
    creationIdFormula: {
      label: { en: "ID Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['id']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract creation ID from bound data",
      },
      /* wwEditor:end */
    },

    creationTitleFormula: {
      label: { en: "Title Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['title'] || context.mapping?.['name']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract title from bound data",
      },
      /* wwEditor:end */
    },

    creationDescriptionFormula: {
      label: { en: "Description Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code:
          "context.mapping?.['description'] || context.mapping?.['desc'] || context.mapping?.['text']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract description from bound data",
      },
      /* wwEditor:end */
    },

    creationImageFormula: {
      label: { en: "Image Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code:
          "context.mapping?.['image'] || context.mapping?.['screenshot'] || context.mapping?.['photo']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract image URL from bound data",
      },
      /* wwEditor:end */
    },

    creationAvatarFormula: {
      label: { en: "Avatar Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code:
          "context.mapping?.['avatar'] || context.mapping?.['userAvatar'] || context.mapping?.['photo']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract creator avatar URL from bound data",
      },
      /* wwEditor:end */
    },

    creationUrlFormula: {
      label: { en: "URL Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.creations) && content.creations.length > 0
            ? content.creations[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['url'] || context.mapping?.['link']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.creations) ||
        !content.creations?.length ||
        !boundProps.creations,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Formula to extract URL from bound data",
      },
      /* wwEditor:end */
    },

    // Moodboard settings
    enableDragDrop: {
      label: { en: "Enable Drag & Drop" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Allow users to drag and reposition images",
      },
      propertyHelp: "Enable drag and drop functionality for repositioning images",
      /* wwEditor:end */
    },

    randomRotation: {
      label: { en: "Random Rotation" },
      type: "OnOff",
      section: "settings",
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Apply random rotation to images for moodboard effect",
      },
      propertyHelp: "Images will be slightly rotated like pasted photos",
      /* wwEditor:end */
    },

    maxRotation: {
      label: { en: "Max Rotation Angle" },
      type: "Number",
      section: "settings",
      min: 0,
      max: 15,
      step: 1,
      defaultValue: 8,
      bindable: true,
      hidden: (content) => !content?.randomRotation,
      /* wwEditor:start */
      bindingValidation: {
        type: "number",
        tooltip: "Maximum rotation angle in degrees (0-15)",
      },
      propertyHelp: "Maximum angle for random rotation of images",
      /* wwEditor:end */
    },

    cardWidth: {
      label: { en: "Card Width" },
      type: "Length",
      section: "settings",
      defaultValue: "280px",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Width of each card (e.g., '280px', '300px')",
      },
      propertyHelp: "Base width for moodboard cards",
      /* wwEditor:end */
    },

    cardHeight: {
      label: { en: "Card Height" },
      type: "Length",
      section: "settings",
      defaultValue: "350px",
      bindable: true,
      hidden: (content) => content?.cardOrientation === "landscape",
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Height of each card (e.g., '350px', '400px')",
      },
      propertyHelp: "Base height for moodboard cards (only used in vertical orientation)",
      /* wwEditor:end */
    },

    cardOrientation: {
      label: { en: "Card Orientation" },
      type: "TextSelect",
      section: "settings",
      options: {
        options: [
          { value: "vertical", label: "Vertical (Portrait)" },
          { value: "landscape", label: "Landscape (Horizontal)" },
        ],
      },
      defaultValue: "vertical",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Valid values: vertical | landscape",
      },
      propertyHelp: "Orientation of the cards - vertical for mobile apps, landscape for desktop/web apps",
      /* wwEditor:end */
    },

    cardSize: {
      label: { en: "Card Size" },
      type: "TextSelect",
      section: "settings",
      options: {
        options: [
          { value: "small", label: "Small (75%)" },
          { value: "medium", label: "Medium (100%)" },
          { value: "large", label: "Large (125%)" },
          { value: "xlarge", label: "Extra Large (150%)" },
        ],
      },
      defaultValue: "medium",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Valid values: small | medium | large | xlarge",
      },
      propertyHelp: "Overall size multiplier for cards - affects all dimensions proportionally",
      /* wwEditor:end */
    },

    landscapeCardWidth: {
      label: { en: "Landscape Card Width" },
      type: "Length",
      section: "settings",
      defaultValue: "500px",
      bindable: true,
      hidden: (content) => content?.cardOrientation !== "landscape",
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Width of landscape cards (e.g., '500px', '600px')",
      },
      propertyHelp: "Width for landscape-oriented cards",
      /* wwEditor:end */
    },

    landscapeCardHeight: {
      label: { en: "Landscape Card Height" },
      type: "Length",
      section: "settings",
      defaultValue: "300px",
      bindable: true,
      hidden: (content) => content?.cardOrientation !== "landscape",
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Height of landscape cards (e.g., '300px', '350px')",
      },
      propertyHelp: "Height for landscape-oriented cards",
      /* wwEditor:end */
    },

    // Styling
    backgroundColor: {
      label: { en: "Background Color" },
      type: "Color",
      section: "style",
      defaultValue: "#f5f5f3",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Background color of the moodboard",
      },
      propertyHelp: "Background color for the moodboard canvas",
      /* wwEditor:end */
    },

    cardShadow: {
      label: { en: "Card Shadow" },
      type: "OnOff",
      section: "style",
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Enable shadow effect on cards",
      },
      propertyHelp: "Add shadow effect to cards for depth",
      /* wwEditor:end */
    },

    imageFit: {
      label: { en: "Image Fit" },
      type: "TextSelect",
      section: "style",
      options: {
        options: [
          { value: "cover", label: "Cover (fill)" },
          { value: "contain", label: "Contain (fit)" },
          { value: "fill", label: "Fill (stretch)" },
          { value: "scale-down", label: "Scale Down" },
        ],
      },
      defaultValue: "cover",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Valid values: cover | contain | fill | scale-down",
      },
      propertyHelp: "How the image should fit within the card",
      /* wwEditor:end */
    },

    contentAreaHeight: {
      label: { en: "Content Area Height" },
      type: "TextSelect",
      section: "style",
      options: {
        options: [
          { value: "small", label: "Small (20%)" },
          { value: "medium", label: "Medium (30%)" },
          { value: "large", label: "Large (40%)" },
          { value: "xlarge", label: "Extra Large (50%)" },
        ],
      },
      defaultValue: "medium",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Valid values: small | medium | large | xlarge",
      },
      propertyHelp: "Height of the white content area (title and description section)",
      /* wwEditor:end */
    },

    titleFontSize: {
      label: { en: "Title Font Size" },
      type: "Length",
      section: "style",
      defaultValue: "18px",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Font size for card titles (e.g., '18px', '20px', '1.2rem')",
      },
      propertyHelp: "Font size for the card title text",
      /* wwEditor:end */
    },

    descriptionFontSize: {
      label: { en: "Description Font Size" },
      type: "Length",
      section: "style",
      defaultValue: "14px",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Font size for card descriptions (e.g., '14px', '16px', '1rem')",
      },
      propertyHelp: "Font size for the card description text",
      /* wwEditor:end */
    },
  },
  triggerEvents: [
    {
      name: "card-click",
      label: { en: "On Card Click" },
      event: { creationId: "", title: "", url: "" },
    },
    {
      name: "card-drag",
      label: { en: "On Card Drag" },
      event: { creationId: "", title: "", position: { x: 0, y: 0 } },
    },
  ],
};
