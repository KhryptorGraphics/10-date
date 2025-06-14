export class PrivacyService {
  private static baseUrl = 'http://localhost:3000/api';

  static async exportData(token: string) {
    const response = await fetch(`${this.baseUrl}/user/data-management/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.json();
  }

  static async deleteAccount(token: string) {
    const response = await fetch(`${this.baseUrl}/user/data-management/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }

    return response.json();
  }

  static async getConsentPreferences(token: string) {
    const response = await fetch(`${this.baseUrl}/user/consent`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get consent preferences');
    }

    return response.json();
  }

  static async updateConsentPreferences(token: string, preferences: any) {
    const response = await fetch(`${this.baseUrl}/user/consent`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update consent preferences');
    }

    return response.json();
  }
}