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
  Globe
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
    const objects = chunks * 25; // Approximate space objects per chunk
    
    if (distance <= 2) return { level: 'Low', color: 'bg-green-500', chunks, objects };
    if (distance <= 4) return { level: 'Medium', color: 'bg-yellow-500', chunks, objects };
    if (distance <= 6) return { level: 'High', color: 'bg-orange-500', chunks, objects };
    return { level: 'Ultra', color: 'bg-red-500', chunks, objects };
  };

  const distanceInfo = getRenderDistanceInfo(renderDistance);

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Space Environment
          </CardTitle>
          <CardDescription>
            Generate infinite space environments with asteroids, planets, and cosmic structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Space Generation</Label>
              <p className="text-sm text-muted-foreground">
                Generates space objects automatically as you explore the cosmos
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
                <Globe className="w-5 h-5" />
                Space Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seed Configuration */}
              <div className="space-y-3">
                <Label>Universe Seed</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newSeed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSeedChange(e.target.value)}
                    placeholder="Enter a universe seed..."
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
                  The seed determines how space objects are distributed. Use the same seed to generate identical universes.
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
                    Generates space regions automatically as you move through space
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
                  max={8}
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
                    <Rocket className="w-4 h-4" />
                    <span>~{Math.floor(distanceInfo.objects / 1000)}k objects</span>
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
                    Removes objects outside view for better performance
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
                        Objects fade in smoothly when new regions are discovered
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

          {/* Universe Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Universe Actions</CardTitle>
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
                      Regenerating Universe...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Regenerate Universe
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  This will clear the current universe and generate a new one with the specified seed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Space Object Types Info */}
          <Card>
            <CardHeader>
              <CardTitle>Space Object Types</CardTitle>
              <CardDescription>
                Objects that can be found in the procedural space environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span>Asteroids</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Planets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>Moons</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
                  <span>Crystals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-600 rounded-full"></div>
                  <span>Space Stations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span>Debris</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 