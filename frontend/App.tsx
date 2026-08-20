import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

type Lead = {
  leadgen_id: string;
  full_name: string;
  email: string;
  phone_number: string;
};

type LeadsResponse = {
  leads: Lead[];
};

const leadsUrl = "http://10.0.2.2:3000/leads";

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLeads = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage("");

    try {
      const response = await fetch(leadsUrl);

      if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
      }

      const responseData: LeadsResponse = await response.json();
      setLeads(Array.isArray(responseData.leads) ? responseData.leads : []);
    } catch {
      setErrorMessage("Could not load leads. Check that the backend is running.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    const socket = io("http://10.0.2.2:3000");

    socket.on("connect", () => {
      console.log("Connected to backend via Socket.IO");
    });

    socket.on("new_lead", (newLead: Lead) => {
      console.log("New lead received via Socket.IO", newLead);

      setLeads((currentLeads) => {
        const leadAlreadyExists = currentLeads.some(
          (lead) => lead.leadgen_id === newLead.leadgen_id,
        );

        if (leadAlreadyExists) {
          return currentLeads;
        }

        return [newLead, ...currentLeads];
      });
    });

    return () => {
      socket.off("new_lead");
      socket.disconnect();
    };
  }, []);

  const normalizedSearchText = searchText.trim().toLowerCase();
  const filteredLeads = leads.filter((lead) => {
    const searchableText = [
      lead.full_name,
      lead.email,
      lead.phone_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchText);
  });

  const renderLead = ({ item }: { item: Lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadCardHeader}>
        <View>
          <Text style={styles.leadEyebrow}>INCOMING LEAD</Text>
          <Text style={styles.leadName}>{item.full_name || "Unnamed lead"}</Text>
        </View>
        <View style={styles.leadStatus}>
          <View style={styles.leadStatusDot} />
          <Text style={styles.leadStatusText}>NEW</Text>
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>EMAIL</Text>
          <Text style={styles.leadDetail}>{item.email || "No email provided"}</Text>
        </View>
        {item.phone_number ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PHONE</Text>
            <Text style={styles.leadDetail}>{item.phone_number}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const emptyMessage = leads.length === 0
    ? "New leads will appear here."
    : "No leads match your search.";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>LF</Text>
              </View>
              <Text style={styles.brandName}>LEADFLOW</Text>
              <View style={styles.brandAccent} />
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE SYNC</Text>
              </View>
            </View>

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Leads</Text>
                <Text style={styles.subtitle}>Your pipeline, in real time.</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => loadLeads(true)}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.refreshButtonPressed,
                ]}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchShell}>
            <Text style={styles.searchLabel}>SEARCH LEADS</Text>
            <TextInput
              autoCapitalize="none"
              clearButtonMode="while-editing"
              onChangeText={setSearchText}
              placeholder="Name, email, or phone"
              placeholderTextColor="#8d8a82"
              style={styles.searchInput}
              value={searchText}
            />
          </View>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color="#176b87" size="large" />
              <Text style={styles.stateText}>Loading leads...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateTitle}>Unable to load leads</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => loadLeads()}
                style={styles.tryAgainButton}>
                <Text style={styles.tryAgainButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={
                filteredLeads.length === 0
                  ? styles.emptyListContent
                  : styles.listContent
              }
              data={filteredLeads}
              keyExtractor={(item, index) => item.leadgen_id || String(index)}
              ListEmptyComponent={
                <View style={styles.stateContainer}>
                  <Text style={styles.stateTitle}>No leads found</Text>
                  <Text style={styles.stateText}>{emptyMessage}</Text>
                </View>
              }
              onRefresh={() => loadLeads(true)}
              refreshing={isRefreshing}
              renderItem={renderLead}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f6f3",
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  hero: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e1e9e4",
    borderBottomWidth: 1,
    marginHorizontal: -18,
    paddingBottom: 26,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: "#4C806B",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  brandName: {
    color: "#17251f",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginLeft: 10,
  },
  brandAccent: {
    backgroundColor: "#4C806B",
    borderRadius: 4,
    height: 8,
    marginLeft: 7,
    width: 8,
  },
  livePill: {
    alignItems: "center",
    backgroundColor: "#e8f0ec",
    borderRadius: 6,
    flexDirection: "row",
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    backgroundColor: "#4C806B",
    borderRadius: 4,
    height: 7,
    marginRight: 7,
    width: 7,
  },
  liveText: {
    color: "#4C806B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  header: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 34,
  },
  title: {
    color: "#17251f",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#68776f",
    fontSize: 14,
    marginTop: 6,
  },
  refreshButton: {
    backgroundColor: "#4C806B",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  refreshButtonPressed: {
    backgroundColor: "#3B6655",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  searchShell: {
    backgroundColor: "#ffffff",
    borderColor: "#dce7e0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  searchLabel: {
    color: "#4C806B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  searchInput: {
    color: "#15171d",
    fontSize: 17,
    paddingBottom: 13,
    paddingHorizontal: 0,
    paddingTop: 7,
  },
  listContent: {
    paddingBottom: 28,
    paddingTop: 18,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingTop: 18,
  },
  leadCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dce7e0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 17,
  },
  leadCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leadEyebrow: {
    color: "#4C806B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 7,
  },
  leadStatus: {
    alignItems: "center",
    backgroundColor: "#e8f0ec",
    borderRadius: 6,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  leadStatusDot: {
    backgroundColor: "#4C806B",
    borderRadius: 3,
    height: 6,
    marginRight: 5,
    width: 6,
  },
  leadStatusText: {
    color: "#4C806B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  leadDetails: {
    borderTopColor: "#e3ebe6",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  detailRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 6,
  },
  detailLabel: {
    color: "#4C806B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingTop: 2,
    width: 58,
  },
  leadName: {
    color: "#4C806B",
    fontSize: 18,
    fontWeight: "800",
  },
  leadDetail: {
    color: "#4C806B",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 21,
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: "#15171d",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  stateText: {
    color: "#77766f",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  tryAgainButton: {
    backgroundColor: "#4C806B",
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tryAgainButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});

export default App;
