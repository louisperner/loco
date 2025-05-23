# Cube Crafter

The Cube Crafter is a powerful tool that allows users to create custom cubes with different textures and colors on each face, similar to Minecraft's block editor.

## Features

- **Visual Cube Net Editor**: Interactive canvas showing the unfolded cube layout
- **Face-by-Face Customization**: Click on any face to select and customize it
- **Color Picker**: Choose from a color palette or use a custom color picker
- **Texture Selection**: Apply any image from your inventory as a texture
- **Apply to All Faces**: Quickly apply the current face's settings to all faces
- **Custom Naming**: Give your custom cubes meaningful names
- **Inventory Integration**: Saved cubes appear in your inventory for reuse

## How to Use

### Opening the Cube Crafter

1. **From Hotbar**: Click the Cube Crafter icon (cube with a dot) in the top navigation bar
2. **From Command Palette**: Type `/` and select "Cube Crafter" from the command palette

### Creating a Custom Cube

1. **Select a Face**: Click on any face in the cube net display
2. **Choose Color or Texture**:
   - Click "Color" to open the color picker
   - Click "Texture" to select from available images
3. **Customize Each Face**: Repeat for all six faces (front, back, left, right, top, bottom)
4. **Apply to All** (Optional): Use "Apply to All Faces" to make all faces match the current selection
5. **Name Your Cube**: Enter a descriptive name in the text field
6. **Save**: Click "Save to Inventory" to add your custom cube to the inventory

### Using Custom Cubes

Once saved, your custom cubes will appear in the inventory and can be:
- Placed in the scene like any other cube
- Selected from the hotbar
- Used in AI chat commands
- Shared or exported (if those features are available)

## Technical Details

### Cube Net Layout

The cube net follows this layout:
```
    [TOP]
[LEFT][FRONT][RIGHT][BACK]
    [BOTTOM]
```

### Face Mapping

- **Right**: +X face of the cube
- **Left**: -X face of the cube  
- **Top**: +Y face of the cube
- **Bottom**: -Y face of the cube
- **Front**: +Z face of the cube
- **Back**: -Z face of the cube

### Storage

Custom cubes are stored in the model store with:
- `customCube: true` flag
- `cubeFaces` object containing all face data
- Generated thumbnail from the front face
- Unique identifier for inventory management

## Tips

- **Preview**: The cube net gives you a real-time preview of your design
- **Textures**: Make sure to add images to your inventory first before using them as textures
- **Naming**: Use descriptive names to easily find your cubes later
- **Reset**: Use "Reset All Faces" to start over with the default green color
- **Consistency**: Use "Apply to All Faces" for uniform cubes, or customize each face for unique designs

## Integration

The Cube Crafter integrates seamlessly with:
- **Inventory System**: Custom cubes appear alongside other items
- **Placement System**: Works with all existing cube placement mechanics
- **Texture System**: Uses the same texture loading system as other components
- **Command System**: Accessible via command palette and hotbar 