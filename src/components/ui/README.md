# 🎨 UI Component Library

A comprehensive, production-ready UI component library built with Vue 3, TypeScript, and Tailwind CSS. All components follow the project's architectural patterns with logic extracted to composables/hooks.

## 🏗️ Architecture

### Clean Separation of Concerns
- **Components** (`*.vue`): Pure templates with minimal logic
- **Hooks** (`hooks/use*.ts`): All component logic, state, and methods
- **Types** (`types.ts`): Shared TypeScript interfaces
- **Index** (`index.ts`): Clean exports for easy importing

### Design Principles
- ✅ **Consistent**: Unified design system across all components
- ✅ **Accessible**: ARIA attributes and keyboard navigation
- ✅ **Responsive**: Mobile-first with dark mode support
- ✅ **Extensible**: Flexible props and className merging
- ✅ **Type-safe**: Full TypeScript support

## 📦 Components

### 📝 Form Components

#### `<Input>`
```vue
<template>
  <Input
    v-model="email"
    type="email"
    placeholder="seu@email.com"
    left-icon="fas fa-envelope"
    :clearable="true"
    :error-message="errors.email"
  />
</template>
```

#### `<Button>`
```vue
<template>
  <Button
    variant="primary"
    size="lg"
    :loading="isSubmitting"
    left-icon="fas fa-save"
    @click="handleSave"
  >
    Salvar
  </Button>
</template>
```

#### `<Select>`
```vue
<template>
  <Select
    v-model="category"
    :options="categories"
    placeholder="Selecione uma categoria"
    :error-message="errors.category"
  />
</template>
```

#### `<Textarea>`
```vue
<template>
  <Textarea
    v-model="description"
    placeholder="Descrição detalhada"
    :max-length="500"
    :show-char-count="true"
    :rows="4"
  />
</template>
```

#### `<Checkbox>`
```vue
<template>
  <Checkbox
    v-model="agreed"
    label="Aceito os termos de uso"
    description="Li e concordo com todos os termos"
  />
</template>
```

#### `<Switch>`
```vue
<template>
  <Switch
    v-model="darkMode"
    label="Modo escuro"
    variant="success"
  />
</template>
```

#### `<Label>`
```vue
<template>
  <Label htmlFor="email" :required="true" variant="bold">
    E-mail
  </Label>
</template>
```

### 🗂️ Layout Components

#### `<Card>`
```vue
<template>
  <Card variant="elevated" size="lg">
    <template #header>
      <h3>Card Title</h3>
    </template>
    
    <p>Card content goes here...</p>
    
    <template #footer>
      <Button>Action</Button>
    </template>
  </Card>
</template>
```

#### `<Modal>`
```vue
<template>
  <Modal
    v-model:open="showModal"
    title="Confirmar ação"
    size="md"
    :dismissible="true"
  >
    <p>Are you sure you want to continue?</p>
    
    <template #footer>
      <Button variant="secondary" @click="showModal = false">
        Cancelar
      </Button>
      <Button variant="danger" @click="confirmAction">
        Confirmar
      </Button>
    </template>
  </Modal>
</template>
```

#### `<Accordion>`
```vue
<template>
  <Accordion
    title="Settings"
    subtitle="Configure your preferences"
    icon="fas fa-cog"
    :default-open="false"
  >
    <p>Accordion content here...</p>
  </Accordion>
</template>
```

#### `<Sheet>`
```vue
<template>
  <Sheet
    v-model:open="showSheet"
    side="bottom"
    size="lg"
    title="Mobile Sheet"
    :show-handle="true"
  >
    <p>Sheet content for mobile interfaces...</p>
  </Sheet>
</template>
```

#### `<Tabs>`
```vue
<template>
  <Tabs
    :items="tabItems"
    variant="pills"
    @change="handleTabChange"
  >
    <template #tab-overview>
      <p>Overview content</p>
    </template>
    <template #tab-details>
      <p>Details content</p>
    </template>
  </Tabs>
</template>
```

#### `<Separator>`
```vue
<template>
  <Separator variant="dashed" color="muted" />
</template>
```

### 🧭 Navigation Components

#### `<Dropdown>`
```vue
<template>
  <Dropdown
    :items="menuItems"
    placement="bottom-start"
    @select="handleMenuSelect"
  >
    <template #trigger="{ toggle }">
      <Button @click="toggle">
        Menu <i class="fas fa-chevron-down ml-2" />
      </Button>
    </template>
  </Dropdown>
</template>
```

### 🎈 Overlay Components

#### `<Popover>`
```vue
<template>
  <Popover
    title="Help Information"
    placement="top"
    trigger="hover"
    :arrow="true"
  >
    <template #trigger>
      <Button variant="ghost">
        <i class="fas fa-question-circle" />
      </Button>
    </template>
    
    <p>This is helpful information!</p>
  </Popover>
</template>
```

### 💬 Feedback Components

#### `<Alert>`
```vue
<template>
  <Alert
    variant="success"
    :dismissible="true"
    @dismiss="handleDismiss"
  >
    Operação realizada com sucesso!
  </Alert>
</template>
```

#### `<Toast>`
```vue
<template>
  <Toast
    type="error"
    title="Erro ao salvar"
    message="Tente novamente em alguns minutos"
    :actions="[
      { label: 'Tentar novamente', action: retry },
      { label: 'Cancelar', action: cancel, variant: 'secondary' }
    ]"
  />
</template>
```

#### `<Progress>`
```vue
<template>
  <Progress
    :value="uploadProgress"
    :max="100"
    variant="success"
    :show-percentage="true"
    label="Upload do arquivo"
  />
</template>
```

#### `<Spinner>`
```vue
<template>
  <Spinner
    size="lg"
    variant="primary"
    type="dots"
    speed="normal"
  />
</template>
```

#### `<Skeleton>`
```vue
<template>
  <Skeleton
    variant="text"
    :lines="3"
    animation="wave"
  />
</template>
```

### 🎯 Data Display Components

#### `<Badge>`
```vue
<template>
  <Badge variant="success" size="sm" :rounded="true">
    Ativo
  </Badge>
  
  <Badge variant="warning" :dot="true" />
</template>
```

#### `<Avatar>`
```vue
<template>
  <Avatar
    src="/user-photo.jpg"
    alt="João Silva"
    size="lg"
    fallback="JS"
    status="online"
    :show-status="true"
  />
</template>
```

#### `<Tooltip>`
```vue
<template>
  <Tooltip
    content="Esta ação não pode ser desfeita"
    position="top"
    trigger="hover"
  >
    <Button variant="danger">Excluir</Button>
  </Tooltip>
</template>
```

## 🚀 Usage

### Import Individual Components
```typescript
import { Button, Input, Card } from '@/components/ui';
```

### Import Component Groups
```typescript
import { 
  FormComponents, 
  LayoutComponents,
  NavigationComponents,
  OverlayComponents,
  FeedbackComponents 
} from '@/components/ui';
```

### Import All Components
```typescript
import { UIComponents } from '@/components/ui';
```

## 🎨 Customization

### Theme Support
- ✅ **Light/Dark mode** automatic detection
- ✅ **Tailwind CSS** for consistent styling
- ✅ **Custom CSS classes** via `className` prop

### Variants
Most components support these variants:
- `default`, `primary`, `secondary`
- `success`, `warning`, `danger`, `info`

### Sizes
Standard sizing across components:
- `xs`, `sm`, `md`, `lg`, `xl`

## ♿ Accessibility

- **ARIA attributes** for screen readers
- **Keyboard navigation** support
- **Focus management** and indicators
- **Color contrast** compliance
- **Semantic HTML** structure

## 🔧 Development

### Adding New Components

1. **Create component directory**: `/components/ui/new-component/`
2. **Implement hook**: `hooks/useNewComponent.ts` (all logic here)
3. **Create component**: `NewComponent.vue` (template only)
4. **Add types**: Update `types.ts` if needed
5. **Export**: Add to `index.ts`

### Best Practices

- ✅ **Extract all logic** to hooks
- ✅ **Use TypeScript** interfaces for props
- ✅ **Support dark mode** with Tailwind classes
- ✅ **Add accessibility** attributes
- ✅ **Include error states** and validation
- ✅ **Test responsiveness** on mobile

## 📱 Mobile Support

All components are:
- **Touch-friendly** with appropriate sizing
- **Responsive** with breakpoint adjustments
- **Gesture-aware** for mobile interactions
- **Performance optimized** for mobile devices

## 🎯 Production Ready

- ✅ **TypeScript** for type safety
- ✅ **Error boundaries** and graceful failures
- ✅ **Performance optimized** with Vue 3 reactivity
- ✅ **Tree-shakeable** exports
- ✅ **SSR compatible** (no client-side dependencies)
- ✅ **Bundle size optimized**

---

**Your UI component library is now complete and ready to power beautiful, accessible user interfaces! 🎉**
