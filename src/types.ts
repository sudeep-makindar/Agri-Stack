export interface EcosystemModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconType: 'node' | 'vote' | 'chart' | 'bot' | 'soil' | 'water' | 'cloud' | 'eye';
  stats?: {
    label: string;
    value: string;
  }[];
  details?: string;
  status: 'ACTIVE' | 'VERIFIED' | 'PROTECTED' | 'LIVE' | 'OPTIMAL' | 'WARNING';
  sensorValue?: string;
  recommendation?: string;
  confidence?: string;
}

export interface FarmLocationData {
  farmId: string;
  name: string;
  latitude: number;
  longitude: number;
  crop: string;
  soilType: string;
  areaHa: number;
  soilMoisture: number;
  temperatureC: number;
  humidityPct: number;
  rainMm: number;
  ndviIndex: number;
}

export interface AdvisoryChatMessage {
  id: string;
  sender: 'farmer' | 'agri-glm';
  text: string;
  timestamp: string;
  sources?: string[];
}

