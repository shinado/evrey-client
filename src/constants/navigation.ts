// 导航栈枚举
export enum NavigatorName {
    ROOT_STACK = 'RootStack',
    ONBOARDING_STACK = 'OnboardingStack',
    MAIN_TAB = 'MainTab',
    HOLDINGS_STACK = 'HoldingsStack',
    AUTH_STACK = 'AuthStack',
    SETTINGS_STACK = 'SettingsStack',
  }
  
// 路由名称枚举
export enum RouterName {

    // ========= 🌳 Root Stack========= 
    LANDING = 'LandingScreen',

    // ========= 🎯 Onboarding Stack========= 
    INTEREST_SELECTION = 'InterestSelectionScreen',

    // ========= 📱 Feed Stack========= 
    FEED = "FeedScreen",
    SEARCH = "SearchScreen",

    // ========= ✨Create Stack========= 
    CREATE_POST = "CreatePostScreen",
    SEARCH_TOKEN = 'SearchTokenScreen',
    DRAFT_LIST = 'DraftListScreen',


    // ========= 💰 Holdings Stack========= 
    HOLDINGS = "HoldingsScreen",
    CASH_OUT = "CashoutScreen",
    DEPOSIT = "DepositScreen",
    SEND = "SendScreen",
    HISTORY_ORDERS = "HistoryOrdersScreen",
    PROFILE = 'ProfileScreen',
    HOLDING_TOKEN = "HoldingTokenScreen",
    POST_COMMISSION = "PostCommissionScreen",
    FOLLOWING = "FollowingScreen",
    FOLLOWERS = "FollowersScreen",


    // ========= ⚙️ Settings Stack========= 
    SETTINGS = 'SettingsScreen',
    HELP_CENTER = 'HelpCenterScreen',
    WALLET = 'WalletScreen',
 

    // ========= 🔄 Common Stack========= 
    TOKEN_INFO = "TokenInfoScreen",
    FEED_DETAIL = "FeedDetailScreen",
    CREATOR_PROFILE = "CreatorProfileScreen",
    WEBVIEW = 'WebViewScreen',


    // ========= 🔐 Auth Stack========= 
    SIGN_IN = 'SignInScreen',
    VERIFICATION = 'VerificationScreen',
    INVITATIONCODESCREEN = 'InvitationCodeScreen',


    // ========= 🗑️ Deprecated========= 
    // REWARDS = 'RewardsScreen',
    // HOME = "HomeScreen",
    // REFERRAL_LIST = 'ReferralListScreen',
    // TRANSACTION_DETAIL = 'TransactionDetailScreen',
    // MININGINTEGRAL = 'MiningIntegralScreen',
    // REBATE = 'RebateScreen',
    // REBATE_ADJUSTMENT = 'RebateAdjustmentScreen',
    // HOLDINGS_ANALYSIS = 'HoldingsAnalysisScreen',
    // INVITEUSERSSCREEN = 'InviteUsersScreen',
  }
  