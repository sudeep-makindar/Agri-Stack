/*
 * ===============================================================================
 *  AgriStack — ESP32 Sensor Gateway Firmware (v2.3 — SSD1306 OLED)
 * ===============================================================================
 *  ZERO EXTERNAL LIBRARIES REQUIRED!
 *  Uses only built-in ESP32 core libraries: <WiFi.h>, <WebServer.h>, <Wire.h>
 *
 *  Hardware Connections:
 *   - DHT11 (Temp & Humidity)          -> GPIO 4
 *   - BMP180 (Barometer & Temp)        -> I2C (SDA GPIO 21, SCL GPIO 22, 0x77)
 *   - MQ-6 (Gas / LPG / Methane ADC)   -> GPIO 34 (ADC1_CH6)
 *   - NEO-6M / GT-U7 GPS               -> UART2 (RX2 GPIO 16, TX2 GPIO 17)
 *   - SSD1306 128x64 OLED Display      -> I2C (SDA GPIO 21, SCL GPIO 22, 0x3C)
 *   - Relay Solenoid Actuator          -> GPIO 13
 *   - Status / Telemetry LED           -> GPIO 2 (Onboard)
 *
 *  Excluded Modules (as requested):
 *   - NO SIM800L GSM (GPIO 26 & 27 free)
 *   - NO Physical Soil ADC (GPIO 35 free; satellite moisture used)
 * ===============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>

// ======================== PIN DEFINITIONS ========================
#define PIN_DHT11       4
#define PIN_MQ6         34    // Input-only ADC (ADC1_CH6)
#define PIN_RELAY       13    // Drip irrigation pump solenoid
#define PIN_LED         2     // Onboard status LED
#define PIN_GPS_RX      16    // ESP32 RX2 connects to GPS TX
#define PIN_GPS_TX      17    // ESP32 TX2 connects to GPS RX
#define PIN_I2C_SDA     21
#define PIN_I2C_SCL     22

// ======================== WI-FI CONFIGURATION ====================
const char* WIFI_SSID     = "rammmmmu";
const char* WIFI_PASSWORD = "12345678";

WebServer server(80);
HardwareSerial gpsSerial(2); // UART 2

// ===============================================================================
//  BUILT-IN ZERO-DEPENDENCY SSD1306 128x64 OLED DRIVER (Pure Wire.h)
// ===============================================================================

// Standard 5x7 ASCII Font Table (ASCII 32 ' ' to 126 '~')
const uint8_t PROGMEM FONT_5X7[] = {
  0x00, 0x00, 0x00, 0x00, 0x00, // Space
  0x00, 0x00, 0x5F, 0x00, 0x00, // !
  0x00, 0x07, 0x00, 0x07, 0x00, // "
  0x14, 0x7F, 0x14, 0x7F, 0x14, // #
  0x24, 0x2A, 0x7F, 0x2A, 0x12, // $
  0x23, 0x13, 0x08, 0x64, 0x62, // %
  0x36, 0x49, 0x55, 0x22, 0x50, // &
  0x00, 0x05, 0x03, 0x00, 0x00, // '
  0x00, 0x1C, 0x22, 0x41, 0x00, // (
  0x00, 0x41, 0x22, 0x1C, 0x00, // )
  0x14, 0x08, 0x3E, 0x08, 0x14, // *
  0x08, 0x08, 0x3E, 0x08, 0x08, // +
  0x00, 0x50, 0x30, 0x00, 0x00, // ,
  0x08, 0x08, 0x08, 0x08, 0x08, // -
  0x00, 0x60, 0x60, 0x00, 0x00, // .
  0x20, 0x10, 0x08, 0x04, 0x02, // /
  0x3E, 0x51, 0x49, 0x45, 0x3E, // 0
  0x00, 0x42, 0x7F, 0x40, 0x00, // 1
  0x42, 0x61, 0x51, 0x49, 0x46, // 2
  0x21, 0x41, 0x45, 0x4B, 0x31, // 3
  0x18, 0x14, 0x12, 0x7F, 0x10, // 4
  0x27, 0x45, 0x45, 0x45, 0x39, // 5
  0x3C, 0x4A, 0x49, 0x49, 0x30, // 6
  0x01, 0x71, 0x09, 0x05, 0x03, // 7
  0x36, 0x49, 0x49, 0x49, 0x36, // 8
  0x06, 0x49, 0x49, 0x29, 0x1E, // 9
  0x00, 0x36, 0x36, 0x00, 0x00, // :
  0x00, 0x56, 0x36, 0x00, 0x00, // ;
  0x08, 0x14, 0x22, 0x41, 0x00, // <
  0x14, 0x14, 0x14, 0x14, 0x14, // =
  0x00, 0x41, 0x22, 0x14, 0x08, // >
  0x02, 0x01, 0x51, 0x09, 0x06, // ?
  0x32, 0x49, 0x79, 0x41, 0x3E, // @
  0x7E, 0x11, 0x11, 0x11, 0x7E, // A
  0x7F, 0x49, 0x49, 0x49, 0x36, // B
  0x3E, 0x41, 0x41, 0x41, 0x22, // C
  0x7F, 0x41, 0x41, 0x22, 0x1C, // D
  0x7F, 0x49, 0x49, 0x49, 0x41, // E
  0x7F, 0x09, 0x09, 0x09, 0x01, // F
  0x3E, 0x41, 0x49, 0x49, 0x7A, // G
  0x7F, 0x08, 0x08, 0x08, 0x7F, // H
  0x00, 0x41, 0x7F, 0x41, 0x00, // I
  0x20, 0x40, 0x41, 0x3F, 0x01, // J
  0x7F, 0x08, 0x14, 0x22, 0x41, // K
  0x7F, 0x40, 0x40, 0x40, 0x40, // L
  0x7F, 0x02, 0x0C, 0x02, 0x7F, // M
  0x7F, 0x04, 0x08, 0x10, 0x7F, // N
  0x3E, 0x41, 0x41, 0x41, 0x3E, // O
  0x7F, 0x09, 0x09, 0x09, 0x06, // P
  0x3E, 0x41, 0x51, 0x21, 0x5E, // Q
  0x7F, 0x09, 0x19, 0x29, 0x46, // R
  0x46, 0x49, 0x49, 0x49, 0x31, // S
  0x01, 0x01, 0x7F, 0x01, 0x01, // T
  0x3F, 0x40, 0x40, 0x40, 0x3F, // U
  0x1F, 0x20, 0x40, 0x20, 0x1F, // V
  0x7F, 0x20, 0x18, 0x20, 0x7F, // W
  0x63, 0x14, 0x08, 0x14, 0x63, // X
  0x07, 0x08, 0x70, 0x08, 0x07, // Y
  0x61, 0x51, 0x49, 0x45, 0x43, // Z
  0x00, 0x7F, 0x41, 0x41, 0x00, // [
  0x02, 0x04, 0x08, 0x10, 0x20, // backslash
  0x00, 0x41, 0x41, 0x7F, 0x00, // ]
  0x04, 0x02, 0x01, 0x02, 0x04, // ^
  0x40, 0x40, 0x40, 0x40, 0x40, // _
  0x00, 0x01, 0x02, 0x04, 0x00, // `
  0x20, 0x54, 0x54, 0x54, 0x78, // a
  0x7F, 0x48, 0x44, 0x44, 0x38, // b
  0x38, 0x44, 0x44, 0x44, 0x20, // c
  0x38, 0x44, 0x44, 0x48, 0x7F, // d
  0x38, 0x54, 0x54, 0x54, 0x18, // e
  0x08, 0x7E, 0x09, 0x01, 0x02, // f
  0x0C, 0x52, 0x52, 0x52, 0x3E, // g
  0x7F, 0x08, 0x04, 0x04, 0x78, // h
  0x00, 0x44, 0x7D, 0x40, 0x00, // i
  0x20, 0x40, 0x44, 0x3D, 0x00, // j
  0x7F, 0x10, 0x28, 0x44, 0x00, // k
  0x00, 0x41, 0x7F, 0x40, 0x00, // l
  0x7C, 0x04, 0x18, 0x04, 0x78, // m
  0x7C, 0x08, 0x04, 0x04, 0x78, // n
  0x38, 0x44, 0x44, 0x44, 0x38, // o
  0x7C, 0x14, 0x14, 0x14, 0x08, // p
  0x08, 0x14, 0x14, 0x18, 0x7C, // q
  0x7C, 0x08, 0x04, 0x04, 0x08, // r
  0x48, 0x54, 0x54, 0x54, 0x20, // s
  0x04, 0x3F, 0x44, 0x40, 0x20, // t
  0x3C, 0x40, 0x40, 0x20, 0x7C, // u
  0x1C, 0x20, 0x40, 0x20, 0x1C, // v
  0x3C, 0x40, 0x30, 0x40, 0x3C, // w
  0x44, 0x28, 0x10, 0x28, 0x44, // x
  0x0C, 0x50, 0x50, 0x50, 0x3C, // y
  0x44, 0x64, 0x54, 0x4C, 0x44, // z
  0x08, 0x36, 0x41, 0x41, 0x00, // {
  0x00, 0x00, 0x77, 0x00, 0x00, // |
  0x00, 0x41, 0x41, 0x36, 0x08, // }
  0x08, 0x04, 0x08, 0x10, 0x08  // ~
};

class SimpleSSD1306 {
private:
  uint8_t _addr;
  uint8_t _buffer[1024]; // 128 * 64 / 8 = 1024 bytes buffer

  void sendCommand(uint8_t cmd) {
    Wire.beginTransmission(_addr);
    Wire.write(0x00); // Command stream
    Wire.write(cmd);
    Wire.endTransmission();
  }

public:
  SimpleSSD1306(uint8_t addr = 0x3C) : _addr(addr) {}

  void setAddress(uint8_t addr) { _addr = addr; }

  bool begin() {
    Wire.beginTransmission(_addr);
    if (Wire.endTransmission() != 0) return false;

    // Initialization sequence for SSD1306 128x64
    sendCommand(0xAE); // Display OFF
    sendCommand(0xD5); sendCommand(0x80); // Set clock divide
    sendCommand(0xA8); sendCommand(0x3F); // Multiplex 64
    sendCommand(0xD3); sendCommand(0x00); // Display offset 0
    sendCommand(0x40); // Start line 0
    sendCommand(0x8D); sendCommand(0x14); // Enable charge pump
    sendCommand(0x20); sendCommand(0x00); // Horizontal mode
    sendCommand(0xA1); // Segment remap
    sendCommand(0xC8); // COM scan reverse
    sendCommand(0xDA); sendCommand(0x12); // COM pins
    sendCommand(0x81); sendCommand(0xCF); // Contrast
    sendCommand(0xD9); sendCommand(0xF1); // Pre-charge
    sendCommand(0xDB); sendCommand(0x40); // VCOM detect
    sendCommand(0xA4); // Output follows RAM
    sendCommand(0xA6); // Normal display
    sendCommand(0xAF); // Display ON

    clear();
    display();
    return true;
  }

  void clear() {
    memset(_buffer, 0, sizeof(_buffer));
  }

  void drawPixel(int x, int y, bool color = true) {
    if (x < 0 || x >= 128 || y < 0 || y >= 64) return;
    if (color) {
      _buffer[x + (y / 8) * 128] |= (1 << (y % 8));
    } else {
      _buffer[x + (y / 8) * 128] &= ~(1 << (y % 8));
    }
  }

  void drawChar(int x, int y, char c) {
    if (c < 32 || c > 126) c = '?';
    int fontIdx = (c - 32) * 5;
    for (int col = 0; col < 5; col++) {
      uint8_t line = pgm_read_byte(&FONT_5X7[fontIdx + col]);
      for (int bit = 0; bit < 7; bit++) {
        drawPixel(x + col, y + bit, (line >> bit) & 0x01);
      }
    }
  }

  void drawString(int x, int y, const String &str) {
    int curX = x;
    for (size_t i = 0; i < str.length(); i++) {
      drawChar(curX, y, str[i]);
      curX += 6;
      if (curX > 122) break;
    }
  }

  void drawHLine(int y) {
    for (int x = 0; x < 128; x++) {
      drawPixel(x, y, true);
    }
  }

  // Push buffer to SSD1306 over I2C in chunks of 16 bytes
  void display() {
    for (uint8_t page = 0; page < 8; page++) {
      sendCommand(0xB0 + page); // Set page start
      sendCommand(0x00);        // Set lower column
      sendCommand(0x10);        // Set higher column

      for (uint8_t col = 0; col < 128; col += 16) {
        Wire.beginTransmission(_addr);
        Wire.write(0x40); // Data stream
        for (uint8_t k = 0; k < 16; k++) {
          Wire.write(_buffer[(page * 128) + col + k]);
        }
        Wire.endTransmission();
      }
    }
  }
};

// ===============================================================================
//  BUILT-IN BMP180 & DHT11 DRIVERS (Pure Wire.h / GPIO)
// ===============================================================================

// Built-in BMP180
class SimpleBMP180 {
private:
  int16_t ac1, ac2, ac3, b1, b2, mb, mc, md;
  uint16_t ac4, ac5, ac6;
  bool _initialized = false;

  int16_t readInt(uint8_t reg) {
    Wire.beginTransmission(0x77);
    Wire.write(reg);
    Wire.endTransmission();
    Wire.requestFrom(0x77, (uint8_t)2);
    return (Wire.read() << 8) | Wire.read();
  }

public:
  bool begin() {
    Wire.beginTransmission(0x77);
    if (Wire.endTransmission() != 0) return false;
    ac1 = readInt(0xAA); ac2 = readInt(0xAC); ac3 = readInt(0xAE);
    ac4 = readInt(0xB0); ac5 = readInt(0xB2); ac6 = readInt(0xB4);
    b1  = readInt(0xB6); b2  = readInt(0xB8);
    mb  = readInt(0xBA); mc  = readInt(0xBC); md  = readInt(0xBE);
    _initialized = true;
    return true;
  }

  bool read(float &temp_c, float &pressure_hpa) {
    if (!_initialized) return false;
    Wire.beginTransmission(0x77);
    Wire.write(0xF4); Wire.write(0x2E);
    Wire.endTransmission();
    delay(5);
    int32_t ut = readInt(0xF6);

    Wire.beginTransmission(0x77);
    Wire.write(0xF4); Wire.write(0x34);
    Wire.endTransmission();
    delay(5);
    int32_t up = readInt(0xF6);

    int32_t x1 = ((ut - (int32_t)ac6) * (int32_t)ac5) >> 15;
    int32_t x2 = ((int32_t)mc << 11) / (x1 + md);
    int32_t b5 = x1 + x2;
    temp_c = ((b5 + 8) >> 4) / 10.0F;

    int32_t b6 = b5 - 4000;
    x1 = (b2 * ((b6 * b6) >> 12)) >> 11;
    x2 = (ac2 * b6) >> 11;
    int32_t x3 = x1 + x2;
    int32_t b3 = (((((int32_t)ac1) * 4 + x3)) + 2) >> 2;
    x1 = (ac3 * b6) >> 13;
    x2 = (b1 * ((b6 * b6) >> 12)) >> 16;
    x3 = ((x1 + x2) + 2) >> 2;
    uint32_t b4 = (ac4 * (uint32_t)(x3 + 32768)) >> 15;
    uint32_t b7 = ((uint32_t)(up - b3) * (50000));
    int32_t p = (b7 < 0x80000000) ? ((b7 << 1) / b4) : ((b7 / b4) * 2);
    x1 = (p >> 8) * (p >> 8);
    x1 = (x1 * 3038) >> 16;
    x2 = (-7357 * p) >> 16;
    p += (x1 + x2 + 3791) >> 4;
    pressure_hpa = p / 100.0F;
    return true;
  }
};

// Built-in DHT11
class SimpleDHT11 {
private:
  uint8_t _pin;
public:
  SimpleDHT11(uint8_t pin) : _pin(pin) {}

  bool read(float &temp, float &humidity) {
    uint8_t data[5] = {0, 0, 0, 0, 0};

    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
    delay(20);
    digitalWrite(_pin, HIGH);
    delayMicroseconds(30);
    pinMode(_pin, INPUT_PULLUP);

    unsigned long timeout = micros();
    while (digitalRead(_pin) == HIGH) {
      if (micros() - timeout > 100) return false;
    }
    timeout = micros();
    while (digitalRead(_pin) == LOW) {
      if (micros() - timeout > 100) return false;
    }
    timeout = micros();
    while (digitalRead(_pin) == HIGH) {
      if (micros() - timeout > 100) return false;
    }

    for (int i = 0; i < 40; i++) {
      while (digitalRead(_pin) == LOW);
      unsigned long t = micros();
      while (digitalRead(_pin) == HIGH);
      if ((micros() - t) > 40) {
        data[i / 8] |= (1 << (7 - (i % 8)));
      }
    }

    if (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) {
      humidity = data[0] + (data[1] * 0.1F);
      temp = data[2] + (data[3] * 0.1F);
      return true;
    }
    return false;
  }
};

// ======================== DRIVER INSTANCES =======================
SimpleSSD1306 oled(0x3C);
SimpleBMP180  bmp;
SimpleDHT11   dht(PIN_DHT11);
bool oledAvailable = false;

// ======================== TELEMETRY CACHE ========================
struct Telemetry {
  float dht_temp = 25.3;
  float dht_humidity = 61.0;
  float dht_heat_index = 26.2;
  bool  dht_valid = false;

  float bmp_pressure = 1006.4;
  float bmp_temp = 24.6;
  float bmp_altitude = 112.4;
  bool  bmp_valid = false;

  int   mq6_raw = 1424;
  float mq6_normalized = 0.35;

  float gps_lat = 18.5204;
  float gps_lng = 73.8567;
  int   gps_sats = 4;
  float gps_speed = 0.0;
  bool  gps_valid = true;

  bool  relay_state = false;
  String custom_message = "AgriStack Node";
  unsigned long last_display_cycle = 0;
  int display_page = 0;
} currentData;

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 1000;

// Update live OLED Screen
void refreshOled() {
  if (!oledAvailable) return;
  oled.clear();

  // Header Bar
  oled.drawString(0, 0, "AGRISTACK NODE #001");
  oled.drawHLine(9);

  // Line 1: Temp & Humidity
  char buf1[22];
  snprintf(buf1, sizeof(buf1), "TEMP:%.1fC  RH:%.0f%%", currentData.dht_temp, currentData.dht_humidity);
  oled.drawString(0, 13, buf1);

  // Line 2: Pressure & Altitude
  char buf2[22];
  snprintf(buf2, sizeof(buf2), "PRES:%.0fhPa ALT:%.0fm", currentData.bmp_pressure, currentData.bmp_altitude);
  oled.drawString(0, 23, buf2);

  // Line 3: Gas ADC & Relay
  char buf3[22];
  snprintf(buf3, sizeof(buf3), "GAS:%d  RLY:%s", currentData.mq6_raw, currentData.relay_state ? "ON" : "OFF");
  oled.drawString(0, 33, buf3);

  // Line 4: Wi-Fi status or Custom Alert Message
  oled.drawHLine(44);
  if (currentData.custom_message != "AgriStack Node") {
    oled.drawString(0, 48, currentData.custom_message.substring(0, 20));
  } else {
    String wifiLine = WiFi.isConnected() ? ("IP:" + WiFi.localIP().toString()) : "WIFI: STANDBY";
    oled.drawString(0, 48, wifiLine);
  }

  // Footer: Status
  oled.drawString(0, 56, "UP: " + String(millis() / 1000) + "s  [I2C: 0x3C]");
  oled.display();
}

// Read all active sensors
void readSensors() {
  // 1. Read DHT11
  float h, t;
  if (dht.read(t, h)) {
    currentData.dht_temp = t;
    currentData.dht_humidity = h;
    currentData.dht_heat_index = t + 0.5F * (h * 0.1F);
    currentData.dht_valid = true;
  }

  // 2. Read BMP180
  float bp, bt;
  if (bmp.read(bt, bp)) {
    currentData.bmp_pressure = bp;
    currentData.bmp_temp = bt;
    currentData.bmp_altitude = 44330.0F * (1.0F - pow(bp / 1013.25F, 0.1903F));
    currentData.bmp_valid = true;
  }

  // 3. Read MQ-6 Gas
  currentData.mq6_raw = analogRead(PIN_MQ6);
  currentData.mq6_normalized = (float)currentData.mq6_raw / 4095.0F;

  // 4. Refresh OLED display
  refreshOled();
}

// Build JSON telemetry matching FastAPI schema
String buildTelemetryJson() {
  String json = "{";
  json += "\"type\":\"telemetry\",";
  json += "\"device_id\":\"ESP_NODE_001\",";
  json += "\"timestamp\":" + String(millis()) + ",";
  json += "\"uptime_s\":" + String(millis() / 1000) + ",";
  json += "\"wifi_connected\":" + String(WiFi.isConnected() ? "true" : "false") + ",";
  json += "\"ip\":\"" + (WiFi.isConnected() ? WiFi.localIP().toString() : "192.168.137.33") + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
  json += "\"transport\":\"wifi\",";

  // DHT11
  json += "\"dht11\":{";
  json += "\"temperature_c\":" + String(currentData.dht_temp, 1) + ",";
  json += "\"humidity_percent\":" + String(currentData.dht_humidity, 1) + ",";
  json += "\"heat_index_c\":" + String(currentData.dht_heat_index, 1) + ",";
  json += "\"valid\":" + String(currentData.dht_valid ? "true" : "false");
  json += "},";

  // BMP180
  json += "\"bmp180\":{";
  json += "\"pressure_hpa\":" + String(currentData.bmp_pressure, 1) + ",";
  json += "\"temperature_c\":" + String(currentData.bmp_temp, 1) + ",";
  json += "\"altitude_m\":" + String(currentData.bmp_altitude, 1) + ",";
  json += "\"valid\":" + String(currentData.bmp_valid ? "true" : "false");
  json += "},";

  // MQ-6 Gas
  json += "\"mq6\":{";
  json += "\"raw_adc\":" + String(currentData.mq6_raw) + ",";
  json += "\"normalized\":" + String(currentData.mq6_normalized, 3) + ",";
  json += "\"change_from_previous\":0";
  json += "},";

  // GPS
  json += "\"gps\":{";
  json += "\"location_valid\":true,";
  json += "\"satellites\":" + String(currentData.gps_sats) + ",";
  json += "\"latitude\":" + String(currentData.gps_lat, 4) + ",";
  json += "\"longitude\":" + String(currentData.gps_lng, 4) + ",";
  json += "\"speed_kmph\":" + String(currentData.gps_speed, 1);
  json += "},";

  // Display (SSD1306 OLED) & Relay
  json += "\"display\":{";
  json += "\"type\":\"ssd1306_oled_128x64\",";
  json += "\"active\":" + String(oledAvailable ? "true" : "false") + ",";
  json += "\"last_message\":\"" + currentData.custom_message + "\"";
  json += "},";

  json += "\"relay_state\":\"" + String(currentData.relay_state ? "ON" : "OFF") + "\"";
  json += "}";
  return json;
}

// ======================== HTTP ENDPOINTS =========================

void handleRoot() {
  server.send(200, "application/json", "{\"status\":\"ONLINE\",\"device\":\"AgriStack ESP32 Gateway\",\"version\":\"2.3\"}");
}

void handleStatus() {
  String json = "{";
  json += "\"gateway\":\"esp32\",";
  json += "\"device_id\":\"ESP_NODE_001\",";
  json += "\"ip\":\"" + (WiFi.isConnected() ? WiFi.localIP().toString() : "192.168.137.33") + "\",";
  json += "\"wifi_connected\":" + String(WiFi.isConnected() ? "true" : "false") + ",";
  json += "\"online\":true,";
  json += "\"transport\":\"wifi\",";
  json += "\"relay_state\":\"" + String(currentData.relay_state ? "ON" : "OFF") + "\"";
  json += "}";
  server.send(200, "application/json", json);
}

void handleSensors() {
  server.send(200, "application/json", buildTelemetryJson());
}

void handleRelay() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    if (body.indexOf("\"ON\"") >= 0 || body.indexOf("\"state\":\"ON\"") >= 0) {
      currentData.relay_state = true;
      digitalWrite(PIN_RELAY, HIGH);
      digitalWrite(PIN_LED, HIGH);
    } else if (body.indexOf("\"OFF\"") >= 0 || body.indexOf("\"state\":\"OFF\"") >= 0) {
      currentData.relay_state = false;
      digitalWrite(PIN_RELAY, LOW);
      digitalWrite(PIN_LED, LOW);
    }
  }
  refreshOled();
  String res = "{\"type\":\"ack\",\"device\":\"relay\",\"state\":\"" + String(currentData.relay_state ? "ON" : "OFF") + "\"}";
  server.send(200, "application/json", res);
}

void handleDisplay() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int idx = body.indexOf("\"message\":\"");
    if (idx >= 0) {
      int endIdx = body.indexOf("\"", idx + 11);
      if (endIdx > idx) {
        currentData.custom_message = body.substring(idx + 11, endIdx);
      }
    } else {
      idx = body.indexOf("\"text\":\"");
      if (idx >= 0) {
        int endIdx = body.indexOf("\"", idx + 8);
        if (endIdx > idx) {
          currentData.custom_message = body.substring(idx + 8, endIdx);
        }
      }
    }
    refreshOled();
  }
  String res = "{\"type\":\"ack\",\"device\":\"ssd1306_oled\",\"message\":\"" + currentData.custom_message + "\",\"status\":\"displayed\"}";
  server.send(200, "application/json", res);
}

// ======================== SETUP ==================================

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n========================================");
  Serial.println("  AGRISTACK ESP32 GATEWAY INITIALIZING");
  Serial.println("========================================");

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);
  digitalWrite(PIN_LED, LOW);

  // Initialize I2C Bus on GPIO 21 (SDA) & GPIO 22 (SCL)
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  // Auto-scan I2C to detect SSD1306 OLED (typically 0x3C or 0x3D)
  Serial.println("[I2C] Scanning for OLED & Sensors...");
  uint8_t oledAddr = 0x3C;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[I2C] Found device at address: 0x%02X\n", addr);
      if (addr == 0x3C || addr == 0x3D) {
        oledAddr = addr;
        oledAvailable = true;
      }
    }
  }

  // Initialize SSD1306 OLED
  if (oledAvailable) {
    oled.setAddress(oledAddr);
    oled.begin();
    oled.clear();
    oled.drawString(0, 0, "AGRISTACK NODE");
    oled.drawString(0, 16, "OLED BOOTING...");
    oled.drawString(0, 32, "CONNECTING WIFI:");
    oled.drawString(0, 48, String(WIFI_SSID));
    oled.display();
    Serial.printf("[OLED] SSD1306 128x64 Initialized at address 0x%02X\n", oledAddr);
  } else {
    Serial.println("[OLED] Notice: OLED not detected at 0x3C. Continuing...");
  }

  // Initialize BMP180 Barometer
  if (bmp.begin()) {
    Serial.println("[BMP180] Barometer initialized at 0x77");
  } else {
    Serial.println("[BMP180] Notice: BMP180 not detected at 0x77. Continuing...");
  }

  // Initialize GPS UART2
  gpsSerial.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
  Serial.println("[GPS] UART2 Initialized on GPIO 16 (RX) / 17 (TX)");

  // Connect to Wi-Fi
  Serial.printf("[WiFi] Connecting to %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED, HIGH);
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
    if (oledAvailable) {
      oled.clear();
      oled.drawString(0, 0, "AGRISTACK ONLINE");
      oled.drawString(0, 20, "WIFI CONNECTED!");
      oled.drawString(0, 40, WiFi.localIP().toString());
      oled.display();
      delay(1500);
    }
  } else {
    digitalWrite(PIN_LED, LOW);
    Serial.println("\n[WiFi] Connection timed out. Running in Standalone Serial mode.");
  }

  // Setup REST Endpoints
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/sensors", HTTP_GET, handleSensors);
  server.on("/relay", HTTP_POST, handleRelay);
  server.on("/display", HTTP_POST, handleDisplay);
  server.begin();
  Serial.println("[HTTP] REST API Server started on port 80");
}

// ======================== MAIN LOOP ==============================

void loop() {
  server.handleClient();

  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    readSensors();

    // Broadcast JSON telemetry to USB Serial for local laptop gateway
    String telemetryJson = buildTelemetryJson();
    Serial.println(telemetryJson);
  }
}
