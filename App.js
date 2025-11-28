import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Text,
  View,
  StyleSheet,
  SectionList,
  StatusBar,
  Alert,
} from "react-native";
import { Searchbar, Provider } from "react-native-paper";
import debounce from "lodash.debounce";
import {
  createTable,
  getMenuItems,
  saveMenuItems,
  filterByQueryAndCategories,
} from "./database";
import Filters from "./components/Filters";
import { getSectionListData } from "./utils";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const API_URL =
  "https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/menu-items-by-category.json";
const sections = ["Appetizers", "Salads", "Beverages"];

const Item = ({ title, price }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.title}>${price}</Text>
  </View>
);

export default function App() {
  const [data, setData] = useState([]);
  const [searchBarText, setSearchBarText] = useState("");
  const [query, setQuery] = useState("");
  const [filterSelections, setFilterSelections] = useState(
    sections.map(() => false)
  );

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();

      const menuRes = json.menu.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category.title,
      }));

      return menuRes;
    } catch (error) {
      console.error(error);
    }

    return [];
  };

  useEffect(() => {
    (async () => {
      try {
        await createTable();

        let menuItems = await getMenuItems();

        if (!menuItems.length) {
          const fetchedItems = await fetchData();

          await saveMenuItems(fetchedItems);

          menuItems = fetchedItems;
        }

        const sectionListData = getSectionListData(menuItems);

        setData(sectionListData);
      } catch (e) {
        console.error("Error in useEffect:", e);
        Alert.alert(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const activeCategories = filterSelections.every((selected) => !selected)
        ? sections
        : sections.filter((_, i) => filterSelections[i]);

      try {
        const menuItems = await filterByQueryAndCategories(
          query,
          activeCategories
        );
        setData(getSectionListData(menuItems));
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    })();
  }, [query, filterSelections]);

  const lookup = useCallback((q) => {
    setQuery(q);
  }, []);

  const debouncedLookup = useMemo(() => debounce(lookup, 500), [lookup]);

  const handleSearchChange = (text) => {
    setSearchBarText(text);
    debouncedLookup(text);
  };

  const handleFiltersChange = async (index) => {
    const arrayCopy = [...filterSelections];
    arrayCopy[index] = !filterSelections[index];
    setFilterSelections(arrayCopy);
  };

  return (
    <Provider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Searchbar
            placeholder="Search"
            placeholderTextColor="white"
            onChangeText={handleSearchChange}
            value={searchBarText}
            style={styles.searchBar}
            iconColor="white"
            inputStyle={{ color: "white" }}
            elevation={0}
          />
          <Filters
            selections={filterSelections}
            onChange={handleFiltersChange}
            sections={sections}
          />
          <SectionList
            style={styles.sectionList}
            sections={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Item title={item.title} price={item.price} />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.header}>{title}</Text>
            )}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "#495E57",
  },
  sectionList: {
    paddingHorizontal: 16,
  },
  searchBar: {
    marginBottom: 24,
    backgroundColor: "#495E57",
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  header: {
    fontSize: 24,
    paddingVertical: 8,
    color: "#FBDABB",
    backgroundColor: "#495E57",
  },
  title: {
    fontSize: 20,
    color: "white",
  },
});
