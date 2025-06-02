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
  Mountain, 
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
  onEnabledChange: (enabled: boolean) => void;
  onRenderDistanceChange: (distance: number) => void;
  onTerrainSeedChange: (seed: number) => void;
  onEnableCullingChange: (enabled: boolean) => void;
  onAutoGenerateChange: (enabled: boolean) => void;
  onRegenerateWorld: (newSeed?: number) => void;
}

export const ProceduralWorldTab: React.FC<ProceduralWorldTabProps> = ({
  enabled,
  renderDistance,
  terrainSeed,
  enableCulling,
  autoGenerate,
  onEnabledChange,
  onRenderDistanceChange,
  onTerrainSeedChange,
  onEnableCullingChange,
  onAutoGenerateChange,
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
    const blocks = chunks * 256; // Approximate visible blocks
    
    if (distance <= 2) return { level: 'Low', color: 'bg-green-500', chunks, blocks };
    if (distance <= 4) return { level: 'Medium', color: 'bg-yellow-500', chunks, blocks };
    if (distance <= 6) return { level: 'High', color: 'bg-orange-500', chunks, blocks };
    return { level: 'Ultra', color: 'bg-red-500', chunks, blocks };
  };

  const distanceInfo = getRenderDistanceInfo(renderDistance);

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Mundo Procedural
          </CardTitle>
          <CardDescription>
            Gere mundos infinitos como Minecraft com terreno procedural
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Ativar Geração Procedural</Label>
              <p className="text-sm text-muted-foreground">
                Gera terreno automaticamente conforme você explora
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
          {/* Terrain Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mountain className="w-5 h-5" />
                Configurações do Terreno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seed Configuration */}
              <div className="space-y-3">
                <Label>Seed do Mundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newSeed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSeedChange(e.target.value)}
                    placeholder="Digite uma seed..."
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
                  A seed determina como o terreno será gerado. Use a mesma seed para gerar o mesmo mundo.
                </p>
              </div>

              <Separator />

              {/* Auto Generation */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Geração Automática
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gera chunks automaticamente conforme você se move
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
                    Distância de Renderização
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
                    <span>{distanceInfo.chunks} chunks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4" />
                    <span>~{Math.floor(distanceInfo.blocks / 1000)}k blocos</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Culling */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Otimização de Culling
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Remove objetos fora da visão para melhor performance
                  </p>
                </div>
                <Switch
                  checked={enableCulling}
                  onCheckedChange={onEnableCullingChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* World Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações do Mundo</CardTitle>
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
                      Regenerando Mundo...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Regenerar Mundo
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  Isso irá limpar o mundo atual e gerar um novo com a seed especificada
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Block Types Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Blocos</CardTitle>
              <CardDescription>
                Blocos que podem ser gerados no mundo procedural
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Grama</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-600 rounded"></div>
                  <span>Terra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span>Pedra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Areia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Água</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-700 rounded"></div>
                  <span>Madeira</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span>Folhas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                  <span>Minérios</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 