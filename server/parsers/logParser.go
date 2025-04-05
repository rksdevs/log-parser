package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Spell struct {
	SpellID      string `json:"spellId"`
	SpellName    string `json:"spellName"`
	TotalDamage  int    `json:"totalDamage"`
	UsefulDamage int    `json:"usefulDamage"`
	TotalCasts   int    `json:"totalCasts"`
	NormalHits   int    `json:"normalHits"`
	CriticalHits int    `json:"criticalHits"`
}

type Actor struct {
	Class            string           `json:"class"`
	Guid             string           `json:"guid"`
	ActorDamage      int              `json:"actorDamage"`
	ActorTotalDamage int              `json:"actorTotalDamage"`
	Healing          int              `json:"healing"`
	SpellList        map[string]Spell `json:"spellList"`
	Pets             map[string]any   `json:"pets"`
}

type Attempt struct {
	Boss            string           `json:"boss"`
	StartTime       string           `json:"startTime"`
	EndTime         string           `json:"endTime"`
	Logs            []string         `json:"logs"`
	AllActors       map[string]Actor `json:"allActors"`
	DamageByActors  map[string]int   `json:"damageByActors"`
	HealingByActors map[string]int   `json:"healingByActors"`
	OverallDamage   int              `json:"overallDamage"`
	OverallHealing  int              `json:"overallHealing"`
}

type StructuredInstance struct {
	Name               string                           `json:"name"`
	EncounterStartTime string                           `json:"encounterStartTime"`
	Fights             map[string]map[string][]*Attempt `json:"fights"`
}

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run logParser.go <inputFilePath> <logId>")
		return
	}

	inputPath := os.Args[1]
	logId := os.Args[2]

	processLogFile(inputPath, logId)
}

func processLogFile(inputPath string, logId string) {
	data, err := os.ReadFile(inputPath)
	if err != nil {
		fmt.Println("❌ Error reading input file:", err)
		return
	}

	var instances []StructuredInstance
	if err := json.Unmarshal(data, &instances); err != nil {
		fmt.Println("❌ Error parsing JSON:", err)
		return
	}

	for _, instance := range instances {
		for _, bosses := range instance.Fights {
			for _, attempts := range bosses {
				for _, attempt := range attempts {
					allActors := map[string]Actor{}
					damageByActors := map[string]int{}
					healingByActors := map[string]int{}
					overallDamage := 0
					overallHealing := 0

					for _, line := range attempt.Logs {
						parts := strings.SplitN(line, " ", 3)
						if len(parts) < 3 {
							continue
						}
						eventData := strings.Split(parts[2], ",")
						if len(eventData) < 5 {
							continue
						}

						eventType := strings.TrimSpace(eventData[0])
						sourceGUID := strings.ReplaceAll(eventData[1], "0x", "")
						sourceName := strings.ReplaceAll(eventData[2], "\"", "")
						_ = strings.ReplaceAll(eventData[4], "0x", "") // targetGUID unused

						spellName := ""
						if len(eventData) > 8 {
							spellName = strings.ReplaceAll(eventData[8], "\"", "")
						}

						if strings.Contains(eventType, "MISSED") || sourceName == "" {
							continue
						}

						actor, exists := allActors[sourceName]
						if !exists {
							actor = Actor{
								Class:     "Unknown",
								Guid:      sourceGUID,
								SpellList: map[string]Spell{},
								Pets:      map[string]any{},
							}
						}

						if strings.Contains(eventType, "DAMAGE") {
							var damageAmount, overkill, resisted, absorbed int
							var critical bool

							if eventType == "SWING_DAMAGE" {
								damageAmount, _ = strconv.Atoi(eventData[7])
								overkill, _ = strconv.Atoi(eventData[8])
								resisted, _ = strconv.Atoi(eventData[10])
								absorbed, _ = strconv.Atoi(eventData[12])
								critical = eventData[13] != "nil"
							} else if len(eventData) >= 17 {
								damageAmount, _ = strconv.Atoi(eventData[10])
								overkill, _ = strconv.Atoi(eventData[11])
								resisted, _ = strconv.Atoi(eventData[13])
								absorbed, _ = strconv.Atoi(eventData[15])
								critical = eventData[16] != "nil"
							} else {
								// Skip if not enough data
								continue
							}

							actual := damageAmount - overkill + resisted + absorbed
							useful := damageAmount - overkill
							key := "Melee"
							if eventType != "SWING_DAMAGE" {
								key = spellName
							}

							spell := actor.SpellList[key]
							if spell.SpellID == "" {
								spell = Spell{
									SpellID:   "999999",
									SpellName: key,
								}
							}
							spell.TotalDamage += actual
							spell.UsefulDamage += useful
							spell.TotalCasts++
							if critical {
								spell.CriticalHits++
							} else {
								spell.NormalHits++
							}
							actor.SpellList[key] = spell
							actor.ActorDamage += damageAmount
							actor.ActorTotalDamage += damageAmount
							damageByActors[sourceName] += damageAmount
							overallDamage += damageAmount
						}

						if strings.Contains(eventType, "HEAL") {
							if len(eventData) > 10 {
								healAmount, _ := strconv.Atoi(eventData[10])
								actor.Healing += healAmount
								overallHealing += healAmount
								healingByActors[sourceName] += healAmount
							}
						}

						allActors[sourceName] = actor
					}

					attempt.AllActors = allActors
					attempt.DamageByActors = damageByActors
					attempt.HealingByActors = healingByActors
					attempt.OverallDamage = overallDamage
					attempt.OverallHealing = overallHealing
					attempt.Logs = nil // remove raw logs after processing
				}
			}
		}
	}

	// Construct output path relative to Go file location
	// exePath, err := os.Executable()
	// if err != nil {
	// 	fmt.Println("❌ Failed to determine executable path:", err)
	// 	return
	// }
	// baseDir := filepath.Dir(exePath)
	baseDir, err := os.Getwd()
	if err != nil {
		fmt.Println("❌ Failed to get working directory:", err)
		return
	}

	outputDir := filepath.Join(baseDir, "logs", "json")
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		fmt.Println("❌ Failed to create output directory:", err)
		return
	}

	outputPath := filepath.Join(outputDir, fmt.Sprintf("log-%s-parsed.json", logId))
	// outputDir := filepath.Join(baseDir, "..", "logs", "json")
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		fmt.Println("❌ Failed to create output directory:", err)
		return
	}

	// outputPath := filepath.Join(outputDir, fmt.Sprintf("log-%s-parsed.json", logId))
	jsonBytes, err := json.MarshalIndent(instances, "", "  ")
	if err != nil {
		fmt.Println("❌ Error encoding output:", err)
		return
	}

	if err := os.WriteFile(outputPath, jsonBytes, 0644); err != nil {
		fmt.Println("❌ Error writing output:", err)
		return
	}

	fmt.Printf("✅ logParser complete. Saved to %s\n", outputPath)
}
