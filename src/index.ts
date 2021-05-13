// import * as pulumi from '@pulumi/pulumi';
import { ComponentResource, ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import * as containerservice from '@pulumi/azure-native/containerservice';
// import * as network from '@pulumi/azure-native/network';

// /* Configuration */
// const config = new pulumi.Config();
// // Required
// const resourceGroupName = config.require('resourceGroupName');
// const resourceName = config.require('resourceName');
// const vnetSubnetID = config.require('vnetSubnetID');
// const dnsPrefix = config.require('dnsPrefix');
// const location = config.require('location');
// const networkPlugin = config.require('networkPlugin');
// //Optional
// const enableAzurePolicy = config.getBoolean('enableAzurePolicy') || false;
// const enablePrivateCluster = config.getBoolean('enablePrivateCluster') || false;
// const enableRBAC = config.getBoolean('enableRBAC') || true;
// const kubernetesVersion = config.get('kubernetesVersion') || '1.19.9';
// const osDiskSizeGB = config.getNumber('osDiskSizeGB') || 30;

export interface AKSArgs {
  resourceGroupName: string;
  resourceName: string;
  vnetSubnetID: string;
  dnsPrefix: string;
  location: string;
  networkPlugin: string;
  enableAzurePolicy?: boolean;
  enablePrivateCluster?: boolean;
  enableRBAC?: boolean;
  kubernetesVersion?: string;
  osDiskSizeGB?: number;
}

export class AKSCluster extends ComponentResource {
  cluster: containerservice.ManagedCluster;

  constructor(name: string, args: AKSArgs, opts?: ComponentResourceOptions) {
    super('exodus:aks', name, {}, opts);

    this.cluster = new containerservice.ManagedCluster(
      `aks-${name}`,
      {
        addonProfiles: {
          azurepolicy: {
            enabled: args.enableAzurePolicy ?? false,
          },
        },
        agentPoolProfiles: [
          {
            count: 1,
            maxPods: 110,
            mode: 'System',
            name: 'agentpool',
            osDiskSizeGB: args.osDiskSizeGB,
            osType: 'Linux',
            type: 'VirtualMachineScaleSets',
            vmSize: 'Standard_D2s_v4',
            vnetSubnetID: args.vnetSubnetID,
          },
        ],
        nodeResourceGroup: `rg-vmss-${args.resourceName}`,
        apiServerAccessProfile: {
          enablePrivateCluster: args.enablePrivateCluster,
        },
        dnsPrefix: args.dnsPrefix,
        enableRBAC: args.enableRBAC,
        kubernetesVersion: args.kubernetesVersion,
        location: args.location,
        networkProfile: {
          loadBalancerSku: 'standard',
          networkPlugin: args.networkPlugin,
        },
        resourceGroupName: args.resourceGroupName,
        resourceName: args.resourceName,
        identity: {
          type: 'SystemAssigned',
        },
        tags: {},
      },
      {
        ignoreChanges: ['agentPoolProfiles'],
        parent: this,
      }
    );
    this.registerOutputs();
  }
}
