
import React from 'react';
import { ViewState, Transaction } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AIConsultation from './components/AIConsultation';
import ConnectData from './components/ConnectData';
import Login from './components/Login';
import NoticeList from './components/NoticeList';
import LaborCostCalculator from './components/LaborCostCalculator';
import LaborContractManager from './components/LaborContractManager';
import TaxReports from './components/TaxReports';
import TaxInvoiceIssuer from './components/TaxInvoiceIssuer';
import DocumentIssuance from './components/DocumentIssuance';
import MyPage from './components/MyPage';
import DrivingLog from './components/DrivingLog';
import TaxDeclaration from './components/TaxDeclaration';
import TaxReportForm from './components/TaxReportForm';
import { MOCK_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userName, setUserName] = React.useState('김택스'); // 상호명 기본값
  const [profileImage, setProfileImage] = React.useState('https://picsum.photos/seed/qtex/200/200'); // 프로필 이미지 상태
  const [view, setView] = React.useState<ViewState>('home');
  const [transactions, setTransactions] = React.useState<Transaction[]>(MOCK_TRANSACTIONS);
  
  // 마이페이지 진입 시 구독 모달을 즉시 열기 위한 상태
  const [showSubscriptionOnMount, setShowSubscriptionOnMount] = React.useState(false);

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleLogin = (name: string) => {
    setUserName(name || '사장님');
    setIsAuthenticated(true);
  };

  const handleGoToSubscription = () => {
    setView('mypage');
    setShowSubscriptionOnMount(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  const renderContent = () => {
    switch (view) {
      case 'home':
        return <Dashboard onNavigate={setView} transactions={transactions} userName={userName} />;
      case 'expenses':
        return <TransactionList mode="expense" transactions={transactions} onTransactionsUpdate={setTransactions} />;
      case 'sales':
        return <TransactionList mode="income" transactions={transactions} onTransactionsUpdate={setTransactions} />;
      case 'ai-consultation':
        return <AIConsultation />;
      case 'reports':
        return <TaxReports transactions={transactions} />;
      case 'tax-declaration':
        return <TaxDeclaration onNavigate={setView} transactions={transactions} />;
      case 'tax-report-form':
        return <TaxReportForm transactions={transactions} />;
      case 'connect':
        return <ConnectData />;
      case 'labor-cost':
        return <LaborCostCalculator onAddTransaction={handleAddTransaction} />;
      case 'labor-contract':
        return <LaborContractManager />;
      case 'tax-invoice':
        return <TaxInvoiceIssuer onAddTransaction={handleAddTransaction} />;
      case 'doc-issuance':
        return <DocumentIssuance />;
      case 'mypage':
        return (
          <MyPage 
            profileImage={profileImage} 
            onProfileImageChange={setProfileImage} 
            autoOpenSubscription={showSubscriptionOnMount}
            onSubscriptionOpened={() => setShowSubscriptionOnMount(false)}
          />
        );
      case 'driving-log':
        return <DrivingLog />;
      case 'notices':
        return <NoticeList />;
      default:
        return <Dashboard onNavigate={setView} transactions={transactions} userName={userName} />;
    }
  };

  return (
    <Layout 
      activeView={view} 
      onViewChange={setView} 
      onSubscribeClick={handleGoToSubscription}
      profileImage={profileImage}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
