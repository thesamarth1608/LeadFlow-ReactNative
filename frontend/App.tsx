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
      <Text style={styles.leadName}>{item.full_name || "Unnamed lead"}</Text>
      <Text style={styles.leadDetail}>{item.email || "No email provided"}</Text>
      {item.phone_number ? (
        <Text style={styles.leadDetail}>{item.phone_number}</Text>
      ) : null}
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
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>LeadFlow</Text>
              <Text style={styles.subtitle}>Leads</Text>
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

          <TextInput
            autoCapitalize="none"
            clearButtonMode="while-editing"
            onChangeText={setSearchText}
            placeholder="Search by name, email, or phone"
            placeholderTextColor="#7b8794"
            style={styles.searchInput}
            value={searchText}
          />

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
    backgroundColor: "#f5f7fb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingTop: 24,
  },
  title: {
    color: "#102a43",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#52606d",
    fontSize: 15,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: "#176b87",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refreshButtonPressed: {
    backgroundColor: "#0f5268",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderColor: "#d9e2ec",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  leadCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d9e2ec",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  leadName: {
    color: "#102a43",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  leadDetail: {
    color: "#52606d",
    fontSize: 14,
    marginTop: 3,
  },
  stateContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: "#243b53",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  stateText: {
    color: "#52606d",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
  },
  tryAgainButton: {
    borderColor: "#176b87",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tryAgainButtonText: {
    color: "#176b87",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default App;
