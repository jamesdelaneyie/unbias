# Radial Menu Implementation

This implementation provides a radial menu system that appears on right-click with hold-and-drag selection.

## Features

- **Right-click activation**: Hold right mouse button to show menu
- **Drag to select**: Move mouse while holding right button to highlight options
- **Release to execute**: Release right button to execute the selected action
- **Configurable options**: Customizable number of arcs, colors, text, and actions
- **Visual feedback**: Selected options are highlighted with different colors

## Usage

### Basic Setup

The radial menu is automatically initialized in the main client with default placeholder options:

```typescript
const radialMenuManager = new RadialMenuManager(app);
```

### Default Options

The implementation comes with 6 placeholder actions:

1. **Build** (Green) - Placeholder for building actions
2. **Attack** (Red) - Placeholder for combat actions
3. **Defend** (Blue) - Placeholder for defensive actions
4. **Heal** (Light Green) - Placeholder for healing actions
5. **Trade** (Orange) - Placeholder for trading actions
6. **Explore** (Purple) - Placeholder for exploration actions

### Customizing Options

You can update the menu options at runtime:

```typescript
const newOptions: RadialMenuOption[] = [
  {
    text: 'Custom Action',
    action: () => {
      console.log('Custom action executed');
      notificationService.addNotification('Custom action triggered', NotificationType.INFO);
    },
    color: 0xff5722, // Optional custom color
  },
  // ... more options
];

radialMenuManager.updateMenuOptions(newOptions);
```

### Customizing Appearance

You can modify the visual properties:

```typescript
radialMenuManager.updateMenuConfig({
  radius: 150, // Outer radius
  centerRadius: 30, // Inner radius (creates donut shape)
  backgroundColor: 0x444444,
  borderColor: 0x00ff00,
  textColor: 0xffffff,
  fontSize: 16,
});
```

## How it Works

1. **Input Detection**: The `InputSystem` has been extended to detect right-click events
2. **Menu Display**: On right-click, the menu appears at the cursor position
3. **Selection**: While holding right-click and moving the mouse, the appropriate arc is highlighted
4. **Execution**: When the right mouse button is released, the selected action is executed

## Integration

The radial menu is integrated into the main game loop:

1. Input is processed by `handleUserInput()`
2. After input processing, `radialMenuManager.handleInput()` is called
3. The menu updates its state and renders accordingly

## Files

- `RadialMenu.ts` - Core radial menu component
- `RadialMenuManager.ts` - Manager that integrates with the game client
- `InputSystem.ts` - Extended to handle right-click events
- `client.ts` - Integration point with main game loop

## Notes

- The menu prevents the default browser context menu
- Actions are executed with notification feedback
- The menu is displayed in the UI layer with high z-index
- Input events are properly handled to avoid conflicts with other game input
