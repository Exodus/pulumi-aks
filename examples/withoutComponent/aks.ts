import * as pulumi from '@pulumi/pulumi';
import * as containerservice from '@pulumi/azure-native/containerservice';
// import * as network from '@pulumi/azure-native/network';

/* Configuration */
const config = new pulumi.Config();
// Required
const resourceGroupName = config.require('resourceGroupName');
const resourceName = config.require('resourceName');
const vnetSubnetID = config.require('vnetSubnetID');
const dnsPrefix = config.require('dnsPrefix');
const location = config.require('location');
const networkPlugin = config.require('networkPlugin');
//Optional
const enableAzurePolicy = config.getBoolean('enableAzurePolicy') || false;
const enablePrivateCluster = config.getBoolean('enablePrivateCluster') || false;
const enableRBAC = config.getBoolean('enableRBAC') || true;
const kubernetesVersion = config.get('kubernetesVersion') || '1.19.9';
const osDiskSizeGB = config.getNumber('osDiskSizeGB') || 30;

export const managedClusterResource = new containerservice.ManagedCluster(
  'managedClusterResource',
  {
    addonProfiles: {
      azurepolicy: {
        enabled: enableAzurePolicy,
      },
    },
    agentPoolProfiles: [
      {
        count: 1,
        maxPods: 110,
        mode: 'System',
        name: 'agentpool',
        osDiskSizeGB,
        osType: 'Linux',
        type: 'VirtualMachineScaleSets',
        vmSize: 'Standard_D2s_v4',
        vnetSubnetID,
      },
    ],
    nodeResourceGroup: `rg-vmss-${resourceName}`,
    apiServerAccessProfile: {
      enablePrivateCluster,
    },
    dnsPrefix,
    enableRBAC,
    kubernetesVersion,
    location,
    networkProfile: {
      loadBalancerSku: 'standard',
      networkPlugin,
    },
    resourceGroupName,
    resourceName,
    identity: {
      type: 'SystemAssigned',
    },
    tags: {},
  },
  {
    ignoreChanges: ['agentPoolProfiles'],
  }
);
