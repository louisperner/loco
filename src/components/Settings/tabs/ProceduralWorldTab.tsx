import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, 
  Zap, 
  Eye, 
  RotateCcw, 
  Settings, 
  Layers,
  Cpu,
  Box,
  Orbit
} from 'lucide-react';

interface ProceduralWorldTabProps {
  enabled: boolean;
  renderDistance: number;
  terrainSeed: number;
  enableCulling: boolean;
  autoGenerate: boolean;
  enableWaveAnimation?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onRenderDistanceChange: (distance: number) => void;
  onTerrainSeedChange: (seed: number) => void;
  onEnableCullingChange: (enabled: boolean) => void;
  onAutoGenerateChange: (enabled: boolean) => void;
  onEnableWaveAnimationChange?: (enabled: boolean) => void;
  onRegenerateWorld: (newSeed?: number) => void;
}

export const ProceduralWorldTab: React.FC<ProceduralWorldTabProps> = ({
  enabled,
  renderDistance,
  terrainSeed,
  enableCulling,
  autoGenerate,
  enableWaveAnimation,
  onEnabledChange,
  onRenderDistanceChange,
  onTerrainSeedChange,
  onEnableCullingChange,
  onAutoGenerateChange,
  onEnableWaveAnimationChange,
  onRegenerateWorld
}) => {
  const [newSeed, setNewSeed] = useState(terrainSeed.toString());
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSeedChange = (value: string) => {
    setNewSeed(value);
    const numericSeed = parseInt(value) || 0;
    onTerrainSeedChange(numericSeed);
  };

  const handleRegenerateWorld = async () => {
    setIsRegenerating(true);
    const seed = parseInt(newSeed) || Math.floor(Math.random() * 1000000);
    onRegenerateWorld(seed);
    
    // Simulate regeneration time
    setTimeout(() => {
      setIsRegenerating(false);
    }, 2000);
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setNewSeed(randomSeed.toString());
    onTerrainSeedChange(randomSeed);
  };

  const getRenderDistanceInfo = (distance: number) => {
    const chunks = (distance * 2 + 1) ** 2;
    const objects = chunks * 4; // Fewer objects per chunk for sparse space
    
    if (distance <= 2) return { level: 'Minimal', color: 'bg-green-500', chunks, objects };
    if (distance <= 3) return { level: 'Light', color: 'bg-yellow-500', chunks, objects };
    if (distance <= 4) return { level: 'Medium', color: 'bg-orange-500', chunks, objects };
    return { level: 'Heavy', color: 'bg-red-500', chunks, objects };
  };

  const distanceInfo = getRenderDistanceInfo(renderDistance);

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Orbit className="w-5 h-5" />
            Floating Space Cubes
          </CardTitle>
          <CardDescription>
            Generate sparse floating cube debris fields with collision properties in zero gravity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Cube Fields</Label>
              <p className="text-sm text-muted-foreground">
                Generates floating cube debris automatically as you explore space
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Space Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Cube Field Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seed Configuration */}
              <div className="space-y-3">
                <Label>Field Seed</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newSeed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSeedChange(e.target.value)}
                    placeholder="Enter a field seed..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={generateRandomSeed}
                    className="px-3"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The seed determines how floating cubes are distributed. Use the same seed to generate identical debris fields.
                </p>
              </div>

              <Separator />

              {/* Auto Generation */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Auto Generation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generates new cube fields automatically as you move through space
                  </p>
                </div>
                <Switch
                  checked={autoGenerate}
                  onCheckedChange={onAutoGenerateChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Render Distance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Render Distance
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${distanceInfo.color} text-white`}>
                      {distanceInfo.level}
                    </Badge>
                    <span className="text-sm font-mono">{renderDistance}</span>
                  </div>
                </div>
                
                <Slider
                  value={[renderDistance]}
                  onValueChange={(value) => onRenderDistanceChange(value[0])}
                  max={6}
                  min={1}
                  step={1}
                  className="w-full"
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>{distanceInfo.chunks} regions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    <span>~{distanceInfo.objects} cubes</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Culling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Optimization Culling
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Removes cubes outside view for better performance
                  </p>
                </div>
                <Switch
                  checked={enableCulling}
                  onCheckedChange={onEnableCullingChange}
                />
              </div>

              {/* Fade Animation */}
              {onEnableWaveAnimationChange && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Fade Animation
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cubes fade in smoothly when new regions are discovered
                      </p>
                    </div>
                    <Switch
                      checked={enableWaveAnimation || false}
                      onCheckedChange={onEnableWaveAnimationChange}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Field Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Field Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleRegenerateWorld}
                  disabled={isRegenerating}
                  className="w-full"
                  variant="outline"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Regenerating Field...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Regenerate Cube Field
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  This will clear the current cube field and generate a new one with the specified seed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cube Types Info */}
          <Card>
            <CardHeader>
              <CardTitle>Floating Cube Types</CardTitle>
              <CardDescription>
                Different types of cubes found floating in space with collision properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                    <span>Small Debris</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 1</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
                    <span>Metal Fragment</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 3</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-stone-500 rounded-sm"></div>
                    <span>Asteroid Chunk</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 8</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-400 rounded-sm"></div>
                    <span>Energy Crystal</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 2</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                    <span>Cargo Container</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 15</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                    <span>Large Wreckage</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mass: 25</Badge>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Zero Gravity:</strong> All cubes float freely in space with collision detection. 
                  Heavier objects have more mass and different collision properties.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 