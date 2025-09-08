"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSensors } from "@/hooks/use-sensors";
import { useMQTT } from "@/hooks/use-mqtt";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: "📊",
    description: "Visão geral do sistema",
  },
  {
    title: "Irrigação",
    href: "/irrigation",
    icon: "💧",
    description: "Controle de irrigação",
  },
  {
    title: "Fertirrigação",
    href: "/fertigation",
    icon: "🌱",
    description: "Sistema de fertirrigação",
  },
  {
    title: "Sensores",
    href: "/sensors",
    icon: "🌡️",
    description: "Monitoramento de sensores",
  },
  {
    title: "Histórico",
    href: "/history",
    icon: "📈",
    description: "Relatórios e histórico",
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: "⚙️",
    description: "Configurações do sistema",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { status: mqttStatus } = useMQTT();
  const { getUnacknowledgedAlerts, getSensorStats } = useSensors();
  
  const unacknowledgedAlerts = getUnacknowledgedAlerts();
  const sensorStats = getSensorStats();

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-gray-200 h-full",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Sistema de Irrigação
              </h1>
              <p className="text-sm text-gray-500">
                Controle e Monitoramento
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? "→" : "←"}
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status MQTT</span>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                mqttStatus.connected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {mqttStatus.connected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sensores</span>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {sensorStats.online}/{sensorStats.total}
              </Badge>
            </div>
          </div>
          
          {unacknowledgedAlerts.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Alertas</span>
              <Badge variant="destructive" className="text-xs">
                {unacknowledgedAlerts.length}
              </Badge>
            </div>
          )}
        </div>
      )}

      {!collapsed && <Separator />}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
                title={collapsed ? item.title : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>Sistema v1.0.0</div>
            <div>Última atualização: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}