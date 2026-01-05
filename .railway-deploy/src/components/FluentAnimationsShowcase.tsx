import {
  FluentFade,
  FluentHover,
  FluentMotion,
  FluentScale,
  FluentSlide,
  FluentStaggerItem,
} from "@/components/FluentMotion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Atom, Sparkles, Wind, Zap } from "lucide-react";

export default function FluentAnimationsShowcase() {
  return (
    <div className="p-6 space-y-6">
      <FluentMotion variant="fadeInUp">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Animações Fluent Motion
          </h1>
          <p className="text-muted-foreground">
            Sistema completo de animações suaves e sofisticadas inspirado no Windows 11
          </p>
        </div>
      </FluentMotion>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FluentMotion variant="fadeInUp" delay={0.1}>
          <Card className="windows-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={24} className="text-primary" />
                Fade In Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Animação suave de entrada com fade e movimento vertical
              </p>
              <div className="flex gap-2">
                <Button className="windows-button">Demo</Button>
              </div>
            </CardContent>
          </Card>
        </FluentMotion>

        <FluentMotion variant="fadeInScale" delay={0.2}>
          <Card className="windows-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind size={24} className="text-accent-teal" />
                Fade In Scale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Entrada com escala gradual e fade elegante
              </p>
              <div className="flex gap-2">
                <Button variant="secondary">Demo</Button>
              </div>
            </CardContent>
          </Card>
        </FluentMotion>

        <FluentMotion variant="slideInLeft" delay={0.3}>
          <Card className="windows-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={24} className="text-accent-orange" />
                Slide In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deslizamento lateral com transição suave
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Demo</Button>
              </div>
            </CardContent>
          </Card>
        </FluentMotion>
      </div>

      <FluentMotion variant="fadeIn" stagger delay={0.4}>
        <Card className="windows-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Atom size={24} className="text-accent-purple" />
              Stagger Animation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Animação em cascata para múltiplos elementos
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <FluentStaggerItem key={item}>
                  <div className="windows-card p-4 text-center reveal-hover">
                    <div className="text-2xl font-bold text-primary">{item}</div>
                    <div className="text-xs text-muted-foreground">Item</div>
                  </div>
                </FluentStaggerItem>
              ))}
            </div>
          </CardContent>
        </Card>
      </FluentMotion>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FluentSlide direction="right" delay={0.5}>
          <Card className="windows-card">
            <CardHeader>
              <CardTitle>Hover Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FluentHover className="windows-card p-4 text-center cursor-pointer">
                <p className="font-medium">Hover para escalar</p>
                <p className="text-xs text-muted-foreground">scale: 1.02</p>
              </FluentHover>
              <div className="windows-card p-4 text-center reveal-hover cursor-pointer">
                <p className="font-medium">Reveal Effect</p>
                <p className="text-xs text-muted-foreground">Windows 11 signature</p>
              </div>
            </CardContent>
          </Card>
        </FluentSlide>

        <FluentScale delay={0.6}>
          <Card className="windows-card">
            <CardHeader>
              <CardTitle>Utility Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="p-2 rounded bg-muted">
                  <code>.animate-fade-in</code>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code>.animate-slide-in-right</code>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code>.animate-scale-in</code>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code>.animate-pulse-glow</code>
                </div>
                <div className="p-2 rounded bg-muted">
                  <code>.animate-stagger</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </FluentScale>
      </div>

      <FluentFade delay={0.7}>
        <Card className="windows-card border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Sistema Completo Implementado</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Todas as animações seguem as diretrizes de Fluent Motion do Windows 11, com curvas
                de easing personalizadas, durações otimizadas e suporte para redução de movimento
                (prefers-reduced-motion).
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button className="windows-button">Explorar Componentes</Button>
                <Button variant="outline" className="reveal-hover">
                  Ver Documentação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </FluentFade>
    </div>
  );
}
