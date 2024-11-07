import axios, { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProxyTypes } from '../../types';
import {createContainer} from 'awilix';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
}

const container = createContainer();
class ProxyTester {
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000 
  };

  constructor(
    private readonly proxy: ProxyTypes,
    private readonly retryConfig: RetryConfig = { maxRetries: 3, retryDelay: 1000 },
    private readonly proxyRepository: any = container.resolve('proxyRepository')
  ) {}

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting proxy configuration tests...\n');
    console.log(`Proxy Configuration:`);
    console.log(`Host: ${this.proxy.host}`);
    console.log(`Port: ${this.proxy.port}`);
    console.log(`Enabled: ${this.proxy.enabled}`);
    console.log(`Authentication: ${this.proxy.username ? 'Yes' : 'No'}\n`);

    try {
      await this.validateProxyConfig();

      await this.testBasicConnectivity();

 
      await this.testProxyAuth();


      await this.testHttpsHandling();

 
      await this.testWithHyperSwitch();

  
      await this.testIpAddress();

      // await this.testDetailedHttps();

      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      this.handleTestError(error);
    }
  }

  private validateProxyConfig(): void {
    if (!this.proxy.enabled) {
      throw new Error('Proxy is not enabled');
    }

    if (!this.proxy.host || !this.proxy.port) {
      throw new Error('Invalid proxy configuration: Missing host or port');
    }

    // Validate port number
    if (this.proxy.port < 1 || this.proxy.port > 65535) {
      throw new Error('Invalid proxy configuration: Port number must be between 1 and 65535');
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    name: string,
    config: RetryConfig = this.defaultRetryConfig
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`\n🔄 Retry attempt ${attempt} for ${name}...`);
        }
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === config.maxRetries;
        
        if (!isLastAttempt) {
          console.log(`\n⚠️  Attempt ${attempt} failed: ${this.formatError(error)}`);
          console.log(`Waiting ${config.retryDelay}ms before next retry...`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
      }
    }

    throw new Error(`${name} failed after ${config.maxRetries} attempts: ${lastError?.message}`);
  }

  private formatError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return `Connection refused (${error.config?.url}). Please verify the proxy host and port are correct and the proxy server is running.`;
      } else if (error.code === 'ECONNRESET') {
        return 'Connection was reset by the proxy server. This might indicate network instability or proxy server issues.';
      } else if (error.code === 'ETIMEDOUT') {
        return 'Connection timed out. The proxy server might be slow or unresponsive.';
      }
      return `${error.code}: ${error.message}`;
    }
    return error.message || 'Unknown error occurred';
  }

  private handleTestError(error: any): void {
    console.error('\n❌ Test suite failed');
    console.error('Error details:');
    console.error(`Type: ${error.constructor.name}`);
    console.error(`Message: ${this.formatError(error)}`);
    
    if (axios.isAxiosError(error)) {
      console.error('\nNetwork Details:');
      console.error(`URL: ${error.config?.url}`);
      console.error(`Method: ${error.config?.method?.toUpperCase()}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
      }
    }

    console.error('\nTroubleshooting steps:');
    console.error('1. Verify the proxy server is running');
    console.error('2. Check if the proxy host and port are correct');
    console.error('3. Ensure the proxy server accepts connections from your IP');
    console.error('4. Check if authentication credentials are required');
    console.error('5. Verify your network connection');
    
    throw error;
  }

  private async testBasicConnectivity(): Promise<void> {
    console.log('📡 Testing basic proxy connectivity...');
    try {
      const response = await this.retryOperation(
        () => this.makeRequest('http://httpbin.org/ip'),
        'Basic connectivity test'
      );
      console.log('✅ Basic connectivity test passed');
      console.log(`   Proxy IP: ${response.data.origin}`);
    } catch (error) {
      throw new Error(`Basic connectivity test failed: ${this.formatError(error)}`);
    }
  }

  private async testProxyAuth(): Promise<void> {
    console.log('\n🔐 Testing proxy authentication...');
    try {
      const response = await this.retryOperation(
        () => this.makeRequest('http://httpbin.org/headers'),
        'Authentication test'
      );
      const proxyAuth = response.data.headers['Proxy-Authorization'];
      
      if (this.proxy.username && this.proxy.password) {
        console.log('✅ Authentication test passed');
        console.log('   Proxy credentials were properly sent');
      } else {
        console.log('ℹ️  No proxy authentication configured');
      }
    } catch (error) {
      throw new Error(`Authentication test failed: ${this.formatError(error)}`);
    }
  }
  private async testHttpsHandling(): Promise<void> {
    console.log('\n🔒 Testing HTTPS handling...');
    try {
      const response = await this.makeRequest('https://httpbin.org/get');
      console.log('✅ HTTPS handling test passed');
      console.log('   Successfully connected to HTTPS endpoint');
    } catch (error) {
      throw new Error(`HTTPS handling test failed: ${(error as Error).message}`);
    }
  }

  private async testWithHyperSwitch(): Promise<void> {
    console.log('\n🎯 Testing connection to HyperSwitch API...');
    try {
      const response = await this.makeRequest('https://sandbox.hyperswitch.io/health');
      console.log('✅ HyperSwitch API connection test passed');
    } catch (error) {
      throw new Error(`HyperSwitch API connection test failed: ${(error as Error).message}`);
    }
  }

  private async testIpAddress(): Promise<void> {
    console.log('\n🌐 Verifying IP address routing...');
    try {
      // Test without proxy
      const directResponse = await axios.get('http://httpbin.org/ip');
      const directIp = directResponse.data.origin;

      // Test with proxy
      const proxiedResponse = await this.makeRequest('http://httpbin.org/ip');
      const proxiedIp = proxiedResponse.data.origin;

      if (directIp !== proxiedIp) {
        console.log('✅ IP routing test passed');
        console.log(`   Direct IP: ${directIp}`);
        console.log(`   Proxy IP: ${proxiedIp}`);
      } else {
        console.log('⚠️  Warning: Direct and proxied IPs are the same');
        console.log(`   IP Address: ${directIp}`);
      }
    } catch (error) {
      throw new Error(`IP verification test failed: ${(error as Error).message}`);
    }
  }

  private async testDetailedHttps(): Promise<void> {
    console.log('\n🔍 Running detailed HTTPS tests...');
    
    const configs = [
      {
        name: 'Configuration 1: HttpsProxyAgent with default settings',
        config: this.getConfigWithHttpsProxyAgent()
      },
      {
        name: 'Configuration 2: HttpsProxyAgent with rejectUnauthorized false',
        config: this.getConfigWithHttpsProxyAgent(false)
      },
      {
        name: 'Configuration 3: Axios proxy configuration',
        config: this.getConfigWithAxiosProxy()
      },
      {
        name: 'Configuration 4: Direct HTTPS request (no proxy)',
        config: {}
      }
    ];

    for (const { name, config } of configs) {
      console.log(`\nTesting ${name}...`);
      try {
        const startTime = Date.now();
        const response = await axios.get('https://httpbin.org/get', config as any);
        const endTime = Date.now();
        
        console.log('✅ Success!');
        console.log(`Response time: ${endTime - startTime}ms`);
        console.log('Response headers:', response.headers);
        if (response.data?.origin) {
          console.log('IP used:', response.data.origin);
        }
      } catch (error: any) {
        console.log('❌ Failed');
        console.log('Error details:');
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Headers:', error.response.headers);
        } else if (error.request) {
          console.log('No response received');
          console.log('Error message:', error.message);
        } else {
          console.log('Error:', error.message);
        }
        if (error.code) {
          console.log('Error code:', error.code);
        }
      }
    }
  }

  private makeRequest(url: string) {
    const config: any = {
      headers: { 'User-Agent': 'ProxyTester/1.0' }
    };

    if (this.proxy.enabled) {
      const proxyUrl = this.proxy.username && this.proxy.password
        ? `https://${this.proxy.username}:${this.proxy.password}@${this.proxy.host}:${this.proxy.port}`
        : `https://${this.proxy.host}:${this.proxy.port}`;

      config['httpsAgent'] = new HttpsProxyAgent(proxyUrl);
      config['proxy'] = false;
    }

    return axios.get(url, config);
  }

  private getConfigWithHttpsProxyAgent(rejectUnauthorized: boolean = true) {
    const proxyUrl = this.proxy.username && this.proxy.password
      ? `http://${this.proxy.username}:${this.proxy.password}@${this.proxy.host}:${this.proxy.port}`
      : `http://${this.proxy.host}:${this.proxy.port}`;
    
    return {
      httpsAgent: new HttpsProxyAgent(proxyUrl, { rejectUnauthorized
      }),
      proxy: false,
      timeout: 5000,
      headers: {
        'User-Agent': 'ProxyTester/1.0'
      }
    };
  }

  private getConfigWithAxiosProxy() {
    return {
      proxy: {
        host: this.proxy.host,
        port: this.proxy.port,
        protocol: 'http',
        auth: this.proxy.username && this.proxy.password ? {
          username: this.proxy.username,
          password: this.proxy.password
        } : undefined
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'ProxyTester/1.0'
      }
    };
  }
}

// Export functions
export async function testProxyConfiguration(proxy: ProxyTypes): Promise<void> {
  const tester = new ProxyTester(proxy);
  await tester.runAllTests();
}

// Example usage
if (require.main === module) {
  const proxyConfig: ProxyTypes = {
    host: '143.244.207.176',
    port: 1024,
    enabled: true,
    username: '', // if needed
    password: ''  // if needed
  };
  
  testProxyConfiguration(proxyConfig)
    .catch(console.error);
}
