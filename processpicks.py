import requests

def process_picks(season, week, picks):
    week_type = 2  # 2 is regular season
    boxscores_url = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{season}/types/{week_type}/weeks/{week}/events?lang=en&region=us"
    game_summary_url = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event="
    event_ids = []
    results = []
    try:
        response = requests.get(boxscores_url)
        if response.status_code == 200:
            boxscores_json = response.json()
            event_ids = [item['$ref'].split('/')[-1].split('?')[0] for item in boxscores_json['items']]
        else:
            print(f"Failed to retrieve data: {response.status_code}")
    except Exception as error:
        print("Error fetching box scores:", error)

    try:
        for id in event_ids:
            response = requests.get(game_summary_url + id)
            teams = response.json()["header"]["competitions"][0]["competitors"]
            data = {
                    "homeTeam": "",
                    "awayTeam": "",
                    "homeScore": "",
                    "awayScore": ""
                }
            for team in teams:
                if team["homeAway"] == "home":
                    data["homeTeam"] = team["team"]["displayName"]
                    data["homeScore"] = team["score"]
                else:
                    data["awayTeam"] = team["team"]["displayName"]
                    data["awayScore"] = team["score"]
            results.append(data)
    except Exception as error:
        print("Error getting game summary:", error)

    print(results)
    exit()

    for pick in picks:
        result = next((res for res in results if res["homeTeam"] == pick["homeTeam"] and res["awayTeam"] == pick["awayTeam"]), None)
        if result == None:
            print("Error Processing: ", pick)
        else:
            try:
                home_score = float(result["homeScore"])
                away_score = float(result["awayScore"])
                value = float(result["value"])
            except Exception as error:
                print("Error converting scores and values", error)
                continue

            if pick["type"] == "favorite" or pick["type"] == "dog":
                pickedTeam = " ".join(pick["text"].split()[:-1])
                if pickedTeam == result["homeTeam"]:
                    outcome = home_score + value > away_score
                    if outcome > 0:
                        pick["result"] = 1
                    elif outcome < 0:
                        pick["result"] = -1
                    else:
                        pick["result"] = 0
                elif pickedTeam == result["awayTeam"]:
                    outcome = away_score + value > home_score
                    if outcome > 0:
                        pick["result"] = 1
                    elif outcome < 0:
                        pick["result"] = -1
                    else:
                        pick["result"] = 0
                else:
                    print("Error Processing Pick:", pick)
            elif pick["type"] == "over":
                outcome = home_score + away_score - value
                if outcome > 0:
                    pick["result"] = 1
                elif outcome < 0:
                    pick["result"] = -1
                else:
                    pick["result"] = 0
            elif pick["type"] == "under":
                outcome = home_score + away_score - value
                if outcome > 0:
                    pick["result"] = -1
                elif outcome < 0:
                    pick["result"] = 1
                else:
                    pick["result"] = 0
            else:
                print("Error Processing Picks", pick)

    return picks

process_picks("2024", 1, None)