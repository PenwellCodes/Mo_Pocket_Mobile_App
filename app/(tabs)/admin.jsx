import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  FlatList,
  SectionList,
  Modal,
  Pressable,
  Dimensions,
  RefreshControl
} from "react-native";
import axiosInstance from "../../api/axiosInstance";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, txRes, vaultRes, revenueRes] = await Promise.all([
        axiosInstance.get("/api/admin/users"),
        axiosInstance.get("/api/admin/transaction"),
        axiosInstance.get("/api/admin/vault"),
        axiosInstance.get("/api/admin/revenue")
      ]);

      setUsers(userRes.data.users || []);
      setTransactions(txRes.data.transaction || []);
      setVaults(vaultRes.data.vault || []);
      setRevenueData(revenueRes.data.data || null);
    } catch (err) {
      console.error("Admin fetch error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalTransactions: transactions.length,
    totalVaults: vaults.length,
    totalDeposits: transactions.filter(t => t.type === 'deposit').length,
    totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    totalPenalties: transactions.filter(t => t.type === 'penalty').length,
    totalDepositAmount: transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalWithdrawalAmount: transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPenaltyAmount: transactions
      .filter(t => t.type === 'penalty')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
  };

  const totalUserPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  // Filter transactions based on search and filter
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === "" || 
      tx.momoTransactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <Icon name="arrow-up" size={16} color="#16a34a" />;
      case 'withdrawal': return <Icon name="arrow-down" size={16} color="#2563eb" />;
      case 'penalty': return <Icon name="exclamation-triangle" size={16} color="#dc2626" />;
      default: return <Icon name="exchange" size={16} color="#4b5563" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit': return { backgroundColor: '#f0fdf4', borderLeftColor: '#86efac' };
      case 'withdrawal': return { backgroundColor: '#eff6ff', borderLeftColor: '#93c5fd' };
      case 'penalty': return { backgroundColor: '#fef2f2', borderLeftColor: '#fca5a5' };
      default: return { backgroundColor: '#f9fafb', borderLeftColor: '#d1d5db' };
    }
  };

  const renderStatsCard = (title, value, iconName, color, subValue = null) => {
    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={[styles.cardValue, { color }]}>{value}</Text>
            {subValue && <Text style={styles.cardSubValue}>{subValue}</Text>}
          </View>
          <Icon name={iconName} size={24} color={color} />
        </View>
      </View>
    );
  };

  const renderTabButton = (id, iconName, label) => {
    return (
      <TouchableOpacity
        key={id}
        onPress={() => setActiveTab(id)}
        style={[
          styles.tabButton,
          activeTab === id ? styles.activeTab : styles.inactiveTab
        ]}
      >
        <Icon name={iconName} size={16} style={styles.tabIcon} />
        <Text style={activeTab === id ? styles.activeTabText : styles.inactiveTabText}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
     
      <View style={styles.mainContainer}>
        {/* Sidebar for larger screens */}
        {Dimensions.get('window').width > 768 && (
          <View style={styles.sidebar}>
            <View style={styles.logoContainer}>
              <Icon name="piggy-bank" size={24} color="#2563eb" />
              <Text style={styles.logoText}>Mo Pocket Admin</Text>
            </View>
            <View style={styles.navContainer}>
              {renderTabButton('overview', 'home', 'Overview')}
              {renderTabButton('revenue', 'line-chart', 'Revenue')}
              {renderTabButton('users', 'users', 'Users')}
              {renderTabButton('transactions', 'exchange', 'Transactions')}
              {renderTabButton('vaults', 'piggy-bank', 'Vaults')}
            </View>
          </View>
        )}

        {/* Main Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.exportButton}>
              <Icon name="download" size={16} color="white" />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile Tabs */}
          {Dimensions.get('window').width <= 768 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.mobileTabs}
            >
              {renderTabButton('overview', 'home', 'Overview')}
              {renderTabButton('revenue', 'line-chart', 'Revenue')}
              {renderTabButton('users', 'users', 'Users')}
              {renderTabButton('transactions', 'exchange', 'Transactions')}
              {renderTabButton('vaults', 'piggy-bank', 'Vaults')}
            </ScrollView>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {/* Stats Cards */}
              <View style={styles.statsGrid}>
                {renderStatsCard(
                  'Total Users', 
                  stats.totalUsers.toString(), 
                  'users', 
                  '#2563eb'
                )}
                {renderStatsCard(
                  'Total Deposits', 
                  stats.totalDeposits.toString(), 
                  'arrow-up', 
                  '#16a34a',
                  `E${stats.totalDepositAmount.toFixed(2)}`
                )}
                {renderStatsCard(
                  'Total Withdrawals', 
                  stats.totalWithdrawals.toString(), 
                  'arrow-down', 
                  '#2563eb',
                  `E${stats.totalWithdrawalAmount.toFixed(2)}`
                )}
                {renderStatsCard(
                  'System Revenue', 
                  `E${revenueData?.revenueBreakdown?.totalRevenue?.toFixed(2) || '0.00'}`, 
                  'money', 
                  '#dc2626',
                  'Fees & Penalties'
                )}
              </View>

              {/* Recent Activity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.transactionsList}>
                  {transactions.slice(0, 5).map((tx, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.transactionItem, 
                        getTransactionColor(tx.type),
                        { borderLeftWidth: 4 }
                      ]}
                    >
                      <View style={styles.transactionInfo}>
                        <View style={styles.transactionIcon}>
                          {getTransactionIcon(tx.type)}
                        </View>
                        <View>
                          <Text style={styles.transactionType}>
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {formatDate(tx.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text style={styles.amountText}>
                          E{tx.amount?.toFixed(2) || '0.00'}
                        </Text>
                        {tx.penaltyFee > 0 && (
                          <Text style={styles.penaltyText}>
                            Penalty: E{tx.penaltyFee.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && revenueData && (
            <View style={styles.tabContent}>
              {/* Revenue Summary Cards */}
              <View style={styles.revenueGrid}>
                {renderStatsCard(
                  'Total System Revenue', 
                  `E${revenueData.revenueBreakdown.totalRevenue.toFixed(2)}`, 
                  'line-chart', 
                  '#16a34a',
                  'All fees & penalties'
                )}
                {renderStatsCard(
                  'Flat Fees Revenue', 
                  `E${revenueData.revenueBreakdown.flatFeesRevenue.toFixed(2)}`, 
                  'money', 
                  '#2563eb',
                  `${revenueData.revenueBreakdown.flatFeesCount} transactions`
                )}
                {renderStatsCard(
                  'Early Withdrawal Penalties', 
                  `E${revenueData.revenueBreakdown.earlyWithdrawalPenaltiesRevenue.toFixed(2)}`, 
                  'percent', 
                  '#dc2626',
                  `${revenueData.revenueBreakdown.earlyWithdrawalPenaltiesCount} penalties`
                )}
              </View>

              {/* System Statistics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Statistics</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Users</Text>
                    <Text style={styles.statValue}>{revenueData.systemStats.totalUsers}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Deposits</Text>
                    <Text style={styles.statValue}>{revenueData.systemStats.totalDeposits}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Withdrawals</Text>
                    <Text style={styles.statValue}>{revenueData.systemStats.totalWithdrawals}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Current Locked Funds</Text>
                    <Text style={styles.statValue}>
                      E{revenueData.systemStats.currentLockedFunds.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Overview</Text>
                <View style={styles.financialGrid}>
                  <View style={[styles.financialItem, styles.depositItem]}>
                    <Text style={styles.financialLabel}>Total Deposits Amount</Text>
                    <Text style={styles.financialValue}>
                      E{revenueData.systemStats.totalDepositsAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.financialItem, styles.withdrawalItem]}>
                    <Text style={styles.financialLabel}>Total Withdrawals Amount</Text>
                    <Text style={styles.financialValue}>
                      E{revenueData.systemStats.totalWithdrawalsAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.financialItem, styles.netItem]}>
                    <Text style={styles.financialLabel}>Net User Funds</Text>
                    <Text style={styles.financialValue}>
                      E{revenueData.systemStats.netUserFunds.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Profit Summary */}
              <View style={[styles.profitContainer, { backgroundColor: '#16a34a' }]}>
                <Text style={[styles.sectionTitle, { color: 'white' }]}>System Profitability</Text>
                <View style={styles.profitGrid}>
                  <View>
                    <Text style={styles.profitLabel}>System Profit</Text>
                    <Text style={styles.profitValue}>
                      E{revenueData.systemStats.systemProfit.toFixed(2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.profitLabel}>Profit Margin</Text>
                    <Text style={styles.profitValue}>
                      {revenueData.summary.systemProfitMargin}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Registered Users</Text>
              <FlatList
                data={paginatedUsers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.userName}</Text>
                      <Text style={styles.userEmail}>{item.userEmail}</Text>
                      <Text style={styles.userPhone}>Phone: {item.phoneNumber}</Text>
                    </View>
                    <View style={[
                      styles.userRole,
                      item.role === 'admin' ? styles.adminRole : styles.userRoleStyle
                    ]}>
                      <Text style={item.role === 'admin' ? styles.adminRoleText : styles.userRoleText}>
                        {item.role}
                      </Text>
                    </View>
                  </View>
                )}
              />

              {totalUserPages > 1 && (
                <View style={styles.pagination}>
                  <Text style={styles.paginationText}>
                    Showing {(userPage - 1) * usersPerPage + 1} to {Math.min(userPage * usersPerPage, users.length)} of {users.length} users
                  </Text>
                  <View style={styles.paginationControls}>
                    <TouchableOpacity
                      onPress={() => setUserPage(userPage - 1)}
                      disabled={userPage === 1}
                      style={[styles.pageButton, userPage === 1 && styles.disabledButton]}
                    >
                      <Text>Previous</Text>
                    </TouchableOpacity>
                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(page => (
                      <TouchableOpacity
                        key={page}
                        onPress={() => setUserPage(page)}
                        style={[
                          styles.pageButton,
                          userPage === page && styles.activePageButton
                        ]}
                      >
                        <Text style={userPage === page && styles.activePageText}>
                          {page}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setUserPage(userPage + 1)}
                      disabled={userPage === totalUserPages}
                      style={[styles.pageButton, userPage === totalUserPages && styles.disabledButton]}
                    >
                      <Text>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <View style={styles.tabContent}>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Icon name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.filterContainer}>
                  <Icon name="filter" size={16} color="#9ca3af" style={styles.filterIcon} />
                  <View style={styles.filterSelect}>
                    <Picker
                      selectedValue={filterType}
                      onValueChange={(itemValue) => setFilterType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="All Types" value="all" />
                      <Picker.Item label="Deposits" value="deposit" />
                      <Picker.Item label="Withdrawals" value="withdrawal" />
                      <Picker.Item label="Penalties" value="penalty" />
                    </Picker>
                  </View>
                </View>
              </View>

              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerText, { width: 100 }]}>Type</Text>
                    <Text style={[styles.headerText, { width: 80 }]}>Amount</Text>
                    <Text style={[styles.headerText, { width: 80 }]}>Penalty</Text>
                    <Text style={[styles.headerText, { width: 150 }]}>Date</Text>
                    <Text style={[styles.headerText, { width: 120 }]}>Transaction ID</Text>
                  </View>
                  {paginatedTransactions.map((tx, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <View style={styles.transactionTypeCell}>
                          {getTransactionIcon(tx.type)}
                          <Text style={styles.transactionTypeText}>
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <Text style={styles.amountCell}>
                          E{tx.amount?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        {tx.penaltyFee > 0 ? (
                          <Text style={styles.penaltyCell}>
                            E{tx.penaltyFee.toFixed(2)}
                          </Text>
                        ) : (
                          <Text style={styles.noPenalty}>-</Text>
                        )}
                      </View>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <Text style={styles.dateCell}>
                          {formatDate(tx.createdAt)}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <Text style={styles.idCell}>
                          {tx.momoTransactionId ? tx.momoTransactionId.substring(0, 8) + '...' : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <Text style={styles.paginationText}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </Text>
                  <View style={styles.paginationControls}>
                    <TouchableOpacity
                      onPress={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
                    >
                      <Text>Previous</Text>
                    </TouchableOpacity>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <TouchableOpacity
                        key={page}
                        onPress={() => handlePageChange(page)}
                        style={[
                          styles.pageButton,
                          currentPage === page && styles.activePageButton
                        ]}
                      >
                        <Text style={currentPage === page && styles.activePageText}>
                          {page}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
                    >
                      <Text>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Vaults Tab */}
          {activeTab === 'vaults' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>User Vaults</Text>
              <FlatList
                data={vaults}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.vaultCard}>
                    <View style={styles.vaultHeader}>
                      <View>
                        <Text style={styles.vaultTitle}>Vault #{item._id?.substring(0, 8)}</Text>
                        <Text style={styles.vaultUserId}>User ID: {item.userId?.substring(0, 8)}...</Text>
                      </View>
                      <View style={styles.vaultBalance}>
                        <Text style={styles.balanceAmount}>E{item.balance?.toFixed(2) || '0.00'}</Text>
                        <Text style={styles.balanceLabel}>Balance</Text>
                      </View>
                    </View>
                    
                    {item.lockedDeposits && item.lockedDeposits.length > 0 && (
                      <View style={styles.lockedDeposits}>
                        <Text style={styles.depositsTitle}>Locked Deposits:</Text>
                        <FlatList
                          data={item.lockedDeposits}
                          keyExtractor={(deposit, depositIndex) => depositIndex.toString()}
                          renderItem={({ item: deposit }) => (
                            <View style={styles.depositItem}>
                              <View style={styles.depositInfo}>
                                <Text style={styles.depositAmount}>E{deposit.amount}</Text>
                                <Text style={styles.depositDetails}>
                                  {deposit.lockPeriodInDays} days • {deposit.status}
                                </Text>
                              </View>
                              <View style={styles.depositDates}>
                                <Text style={styles.depositDate}>Start: {formatDate(deposit.startDate)}</Text>
                                <Text style={styles.depositDate}>End: {formatDate(deposit.endDate)}</Text>
                              </View>
                            </View>
                          )}
                        />
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 256,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  navContainer: {
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#dbeafe',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabIcon: {
    width: 20,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  inactiveTabText: {
    color: '#4b5563',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  mobileTabs: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubValue: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionType: {
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontWeight: '600',
    color: '#111827',
  },
  penaltyText: {
    fontSize: 12,
    color: '#dc2626',
  },
  revenueGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  financialGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  financialItem: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
  },
  depositItem: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  withdrawalItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  netItem: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  financialLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  profitGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitLabel: {
    color: '#d1fae5',
    marginBottom: 8,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userRole: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  adminRole: {
    backgroundColor: '#fee2e2',
  },
  userRoleStyle: {
    backgroundColor: '#dcfce7',
  },
  adminRoleText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '500',
  },
  userRoleText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
  },
  pagination: {
    marginTop: 16,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 8,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  activePageButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  activePageText: {
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterSelect: {
    height: 40,
    width: 120,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    justifyContent: 'center',
  },
  transactionTypeCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTypeText: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  amountCell: {
    fontWeight: '600',
  },
  penaltyCell: {
    fontWeight: '600',
    color: '#dc2626',
  },
  noPenalty: {
    color: '#9ca3af',
  },
  dateCell: {
    fontSize: 12,
    color: '#6b7280',
  },
  idCell: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7280',
  },
  vaultCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaultTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  vaultUserId: {
    fontSize: 12,
    color: '#6b7280',
  },
  vaultBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lockedDeposits: {
    marginTop: 12,
  },
  depositsTitle: {
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  depositItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  depositInfo: {
    marginBottom: 8,
  },
  depositAmount: {
    fontWeight: '600',
    color: '#111827',
  },
  depositDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  depositDates: {},
  depositDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default AdminDashboard;