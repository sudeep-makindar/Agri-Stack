/*
 * ===============================================================================
 *  AgriStack — Standalone I2C LED / LCD Test & Hardware Scanner
 * ===============================================================================
 *  Zero external libraries needed! Uses only built-in <Wire.h>.
 *
 *  ESP32 Pin Connections:
 *   - I2C SDA -> GPIO 21
 *   - I2C SCL -> GPIO 22
 *   - VCC     -> 5V (VIN) for LCD / LED Backlight, or 3.3V
 *   - GND     -> GND
 * ===============================================================================
 */

#include <Wire.h>

#define PIN_I2C_SDA  21
#define PIN_I2C_SCL  22
#define PIN_ONBOARD_LED 2

uint8_t detectedI2CAddress = 0;
bool isLcd = false;

// Lightweight pure Wire.h PCF8574 LCD Driver
class SimpleI2CLCD {
private:
  uint8_t _addr;
  uint8_t _backlight;

  void writeNibble(uint8_t nibble, uint8_t mode) {
    uint8_t data = (nibble & 0xF0) | _backlight | mode;
    Wire.beginTransmission(_addr);
    Wire.write(data | 0x04);
    Wire.endTransmission();
    delayMicroseconds(2);
    Wire.beginTransmission(_addr);
    Wire.write(data & ~0x04);
    Wire.endTransmission();
    delayMicroseconds(50);
  }

  void send(uint8_t value, uint8_t mode) {
    writeNibble(value & 0xF0, mode);
    writeNibble((value << 4) & 0xF0, mode);
  }

public:
  SimpleI2CLCD(uint8_t addr = 0x27) : _addr(addr), _backlight(0x08) {}

  void setAddress(uint8_t addr) { _addr = addr; }

  bool begin() {
    Wire.beginTransmission(_addr);
    if (Wire.endTransmission() != 0) return false;
    delay(50);
    writeNibble(0x30, 0); delay(5);
    writeNibble(0x30, 0); delayMicroseconds(150);
    writeNibble(0x30, 0); delayMicroseconds(150);
    writeNibble(0x20, 0); delayMicroseconds(150); // 4-bit mode
    send(0x28, 0); // 2 lines
    send(0x08, 0); // display off
    clear();
    send(0x06, 0); // entry mode
    send(0x0C, 0); // display on
    return true;
  }

  void clear() {
    send(0x01, 0);
    delay(2);
  }

  void setCursor(uint8_t col, uint8_t row) {
    uint8_t rowOffsets[] = {0x00, 0x40};
    send(0x80 | (col + (row ? 0x40 : 0x00)), 0);
  }

  void print(const String& str) {
    for (size_t i = 0; i < str.length(); i++) {
      send((uint8_t)str[i], 0x01);
    }
  }

  void printLine(uint8_t row, const String& str) {
    setCursor(0, row);
    String padded = str;
    while (padded.length() < 16) padded += " ";
    print(padded);
  }

  void setBacklight(bool on) {
    _backlight = on ? 0x08 : 0x00;
    Wire.beginTransmission(_addr);
    Wire.write(_backlight);
    Wire.endTransmission();
  }
};

SimpleI2CLCD lcd(0x27);

// Scan I2C bus and report all connected devices
void scanI2CBus() {
  Serial.println("\n-------------------------------------------");
  Serial.println("  SCANNING I2C BUS (SDA=21, SCL=22)...");
  Serial.println("-------------------------------------------");

  byte count = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("  [✓] FOUND I2C DEVICE AT: 0x%02X", address);
      if (address == 0x27 || address == 0x3F) {
        Serial.print("  <-- Standard I2C LCD / LED Backpack!");
        detectedI2CAddress = address;
        isLcd = true;
      } else if (address == 0x77) {
        Serial.print("  <-- BMP180 Barometer");
      } else if (address == 0x68) {
        Serial.print("  <-- DS3231 RTC or MPU9250 IMU");
      } else if (address == 0x69) {
        Serial.print("  <-- MPU9250 IMU (AD0 High)");
      }
      Serial.println();
      count++;
    }
  }

  if (count == 0) {
    Serial.println("  [!] NO I2C DEVICES FOUND!");
    Serial.println("      Check wiring: SDA -> GPIO 21, SCL -> GPIO 22, VCC & GND");
  } else {
    Serial.printf("  Total devices detected: %d\n", count);
  }
  Serial.println("-------------------------------------------\n");
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(PIN_ONBOARD_LED, OUTPUT);

  Serial.println("\n==========================================");
  Serial.println("   AGRISTACK I2C LED & DISPLAY TEST RIG   ");
  Serial.println("==========================================");

  // Initialize I2C Bus on GPIO 21 & 22
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  // Scan bus
  scanI2CBus();

  // If detected, initialize display
  if (detectedI2CAddress != 0) {
    lcd.setAddress(detectedI2CAddress);
    if (lcd.begin()) {
      Serial.printf("[TEST] LCD successfully initialized at address 0x%02X!\n", detectedI2CAddress);
      lcd.printLine(0, "I2C LED/LCD TEST");
      lcd.printLine(1, "ADDR: 0x" + String(detectedI2CAddress, HEX) + " OK!");
    }
  }
}

int testCounter = 0;
bool ledState = false;

void loop() {
  testCounter++;
  ledState = !ledState;

  // 1. Blink onboard LED
  digitalWrite(PIN_ONBOARD_LED, ledState ? HIGH : LOW);

  // 2. If an I2C device is found:
  if (detectedI2CAddress != 0) {
    // A) Toggle backlight / I2C LED state
    lcd.setBacklight(ledState);

    // B) Update LCD counter display
    char buf1[17];
    char buf2[17];
    snprintf(buf1, sizeof(buf1), "I2C BLINK: %s", ledState ? "[ON]" : "[OFF]");
    snprintf(buf2, sizeof(buf2), "COUNTER: #%d", testCounter);

    lcd.printLine(0, buf1);
    lcd.printLine(1, buf2);

    // C) Also write raw I2C bytes (tests raw I2C LED / IO expander boards)
    Wire.beginTransmission(detectedI2CAddress);
    Wire.write(ledState ? 0xFF : 0x00);
    Wire.endTransmission();

    Serial.printf("[TEST #%d] I2C Device 0x%02X -> LED/Backlight: %s\n",
                  testCounter, detectedI2CAddress, ledState ? "HIGH" : "LOW");
  } else {
    Serial.println("[WAITING] Scanning again in 3 seconds...");
    scanI2CBus();
  }

  delay(1000); // Blink every 1 second
}
